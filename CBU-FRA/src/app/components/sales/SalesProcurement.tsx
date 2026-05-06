import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Calendar,
  Check,
  User,
  Package,
  DollarSign,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

// Types for Sales API (as provided by user)
interface Collection {
  collection_id: string;
  batch_id: string;
  farmer_id: string;
  number_of_bags: number;
  current_state: string;
  collected_at: string;
  in_transit_at: string;
  stored_at: string;
}

interface FarmerCollectionsResponse {
  farmer_id: string;
  farmer_name: string;
  stored_only: boolean;
  collections: Collection[];
}

interface AdminInfo {
  admin_id: string;
  name: string;
  email: string;
}

interface SaleRequest {
  admin_id: string;
  farmer_id: string;
  total_price: number;
  batch_id: string;
}

interface SaleResponse {
  sale_id: string;
  farmer_id: string;
  batch_id: string;
  collection_id: string;
  total_price: number;
  status: string;
}

interface SoldFarmer {
  farmer_id: string;
  farmer_name: string;
  sale_id: string;
  batch_id: string;
  total_price: number;
  status: string;
}

interface AdminSalesResponse {
  admin_id: string;
  sold_farmers: SoldFarmer[];
}

const normalizeStatus = (status?: string) =>
  status?.toLowerCase().replace(/_/g, "-") ?? "";

const getStatusLabel = (status?: string) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "created") return "Created";
  if (normalizedStatus === "approved") return "Approved";
  if (normalizedStatus === "sent") return "Sent";
  if (normalizedStatus === "confirmed") return "Confirmed";
  if (normalizedStatus === "delivered") return "Delivered";
  if (normalizedStatus === "stored") return "Stored";
  if (normalizedStatus === "in-transit") return "In Transit";
  if (normalizedStatus === "collected") return "Collected";

  return status || "Unknown";
};

const getStatusIcon = (status?: string) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "created" || normalizedStatus === "approved" || normalizedStatus === "confirmed") {
    return <CheckCircle className="w-4 h-4" />;
  }

  if (normalizedStatus === "delivered" || normalizedStatus === "sent") {
    return <Package className="w-4 h-4" />;
  }

  if (normalizedStatus === "in-transit") {
    return <Clock className="w-4 h-4" />;
  }

  if (normalizedStatus === "collected") {
    return <Package className="w-4 h-4" />;
  }

  return <AlertCircle className="w-4 h-4" />;
};

const getStatusClassName = (status?: string) => {
  const normalizedStatus = normalizeStatus(status);

  if (normalizedStatus === "created" || normalizedStatus === "approved" || normalizedStatus === "confirmed") {
    return "bg-green-100 text-green-800";
  }

  if (normalizedStatus === "delivered" || normalizedStatus === "sent") {
    return "bg-blue-100 text-blue-800";
  }

  if (normalizedStatus === "in-transit") {
    return "bg-yellow-100 text-yellow-800";
  }

  if (normalizedStatus === "collected") {
    return "bg-purple-100 text-purple-800";
  }

  return "bg-gray-100 text-gray-800";
};

export function SalesProcurement() {
  const [selectedFarmer, setSelectedFarmer] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [totalPrice, setTotalPrice] = useState<string>("");
  const [saleCreating, setSaleCreating] = useState(false);
  const [approvingPayout, setApprovingPayout] = useState<string>("");
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Fetch admin info
  const { data: adminInfo, isLoading: adminLoading } = useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => apiRequest<AdminInfo>("/auth/me", { token }),
    enabled: !!token,
  });

  // Fetch farmers for selection
  const { data: farmersResponse, isLoading: farmersLoading } = useQuery({
    queryKey: ["farmers", "list"],
    queryFn: () => apiRequest<any>("/mobile/farmers", { token }),
    enabled: !!token,
  });

  const farmers = farmersResponse?.data.farmers ?? [];

  // Fetch farmer collections when farmer is selected
  const { data: collectionsResponse, isLoading: collectionsLoading } = useQuery({
    queryKey: ["farmer-collections", selectedFarmer],
    queryFn: () =>
      apiRequest<FarmerCollectionsResponse>(
        `/api/web/payments/sales/farmers/${selectedFarmer}/collections?stored_only=true`,
        { token }
      ),
    enabled: !!selectedFarmer && !!token,
  });

  // Fetch admin sales
  const { data: adminSalesResponse, isLoading: salesLoading } = useQuery({
    queryKey: ["admin-sales", adminInfo?.admin_id],
    queryFn: () =>
      apiRequest<AdminSalesResponse>(
        `/api/web/payments/sales/admin/${adminInfo?.admin_id}`,
        { token }
      ),
    enabled: !!adminInfo?.admin_id && !!token,
  });

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (saleData: SaleRequest) => {
      return apiRequest<SaleResponse>("/api/web/payments/sales", {
        method: "POST",
        token,
        body: saleData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      setSelectedFarmer("");
      setSelectedBatch("");
      setTotalPrice("");
      alert("Sale created successfully!");
    },
    onError: (error: any) => {
      alert(`Failed to create sale: ${error.message}`);
    },
  });

  // Approve payout mutation
  const approvePayoutMutation = useMutation({
    mutationFn: async (saleId: string) => {
      return apiRequest<any>(`/api/web/payments/sales/${saleId}/approve-disbursement`, {
        method: "POST",
        token,
      });
    },
    onSuccess: (_, saleId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-sales"] });
      setApprovingPayout("");
      alert(`Payout approved for sale ${saleId}`);
    },
    onError: (error: any) => {
      alert(`Failed to approve payout: ${error.message}`);
      setApprovingPayout("");
    },
  });

  const handleFarmerToggle = (farmerId: string) => {
    if (!farmerId) return;
    setSelectedFarmer((prev) => (prev === farmerId ? "" : farmerId));
    setSelectedBatch(""); // Reset batch selection
  };

  const handleCreateSale = async () => {
    if (!selectedFarmer || !selectedBatch || !totalPrice || !adminInfo?.admin_id) {
      alert("Please select farmer, batch, enter total price, and ensure admin is loaded");
      return;
    }

    const saleData: SaleRequest = {
      admin_id: adminInfo.admin_id,
      farmer_id: selectedFarmer,
      total_price: parseFloat(totalPrice),
      batch_id: selectedBatch,
    };

    createSaleMutation.mutate(saleData);
  };

  const handleApprovePayout = (saleId: string) => {
    setApprovingPayout(saleId);
    approvePayoutMutation.mutate(saleId);
  };

  const selectedFarmerData = farmers.find((f: any) => f.id === selectedFarmer);
  const collections = collectionsResponse?.collections || [];
  const selectedBatchData = collections.find((c) => c.batch_id === selectedBatch);
  const soldFarmers = adminSalesResponse?.sold_farmers || [];

  const isLoading = farmersLoading || collectionsLoading || adminLoading || salesLoading;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">SALES PROCUREMENT</h1>
        <p className="text-muted-foreground">
          Manage farmer sales and payouts from stored collections
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground mb-3">
                Available Farmers ({farmers.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                Select one farmer to view stored collections
              </p>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-350px)] overflow-y-auto">
              {farmers.length > 0 ? (
                farmers.map((farmer: any) => (
                  <div
                    key={farmer.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="farmer-selection"
                        checked={selectedFarmer === farmer.id}
                        onChange={() => handleFarmerToggle(farmer.id)}
                        className="w-5 h-5 mt-0.5 border-2 border-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground font-medium">
                          {farmer.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {farmer.phone || "No phone"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          {farmer.location || "No location"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {isLoading ? "Loading farmers..." : "No farmers found"}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground mb-3">
                Create Sale
              </h2>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-sm text-card-foreground font-medium">
                    Selected Farmer
                  </h3>
                </div>
                {selectedFarmer ? (
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      <Check className="w-4 h-4" />
                      {selectedFarmerData?.name || "Unknown"}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No farmer selected yet
                  </p>
                )}
              </div>

              {selectedFarmer && (
                <>
                  <div className="bg-muted/30 rounded-lg p-4 border border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-primary" />
                      <h3 className="text-sm text-card-foreground font-medium">
                        Stored Collections ({collections.length})
                      </h3>
                    </div>
                    {collections.length > 0 ? (
                      <div className="space-y-2">
                        {collections.map((collection) => (
                          <div
                            key={collection.collection_id}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="radio"
                                name="batch-selection"
                                checked={selectedBatch === collection.batch_id}
                                onChange={() => setSelectedBatch(collection.batch_id)}
                                className="w-4 h-4 border-2 border-primary cursor-pointer"
                              />
                              <div>
                                <p className="text-sm font-medium">
                                  Batch: {collection.batch_id.slice(-8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {collection.number_of_bags} bags • {getStatusLabel(collection.current_state)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Stored: {new Date(collection.stored_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusClassName(
                                collection.current_state
                              )}`}
                            >
                              {getStatusIcon(collection.current_state)}
                              {getStatusLabel(collection.current_state)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {collectionsLoading ? "Loading collections..." : "No stored collections found"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Total Price
                      </div>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={totalPrice}
                      onChange={(e) => setTotalPrice(e.target.value)}
                      placeholder="Enter total price"
                      className="w-full px-4 py-3 border border-border rounded-lg bg-input-background text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {selectedBatch && (
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Sale Preview:
                      </p>
                      <div className="text-sm text-card-foreground space-y-2">
                        <p>
                          Farmer: <span className="font-medium">{selectedFarmerData?.name}</span>
                        </p>
                        <p>
                          Batch: <span className="font-medium">{selectedBatch.slice(-8)}</span>
                        </p>
                        <p>
                          Bags: <span className="font-medium">{selectedBatchData?.number_of_bags || "N/A"}</span>
                        </p>
                        <p>
                          Total Price: <span className="font-medium">ZMW {totalPrice || "0.00"}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    <button
                      onClick={() => {
                        setSelectedFarmer("");
                        setSelectedBatch("");
                        setTotalPrice("");
                      }}
                      className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
                    >
                      Clear Form
                    </button>
                    <button
                      onClick={handleCreateSale}
                      disabled={
                        createSaleMutation.isPending ||
                        !selectedFarmer ||
                        !selectedBatch ||
                        !totalPrice ||
                        !adminInfo?.admin_id
                      }
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      {createSaleMutation.isPending ? "Creating..." : "Create Sale"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h2 className="text-lg text-card-foreground mb-3">
              Sold Farmers ({soldFarmers.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Recent sales and payout status
            </p>
          </div>
          <div className="divide-y divide-border">
            {soldFarmers.length > 0 ? (
              soldFarmers.map((sale) => (
                <div key={sale.sale_id} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm text-card-foreground font-medium">
                        {sale.farmer_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Batch: {sale.batch_id.slice(-8)} • ZMW {sale.total_price}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${getStatusClassName(
                          sale.status
                        )}`}
                      >
                        {getStatusIcon(sale.status)}
                        {getStatusLabel(sale.status)}
                      </span>
                      {sale.status === "CREATED" && (
                        <button
                          onClick={() => handleApprovePayout(sale.sale_id)}
                          disabled={approvingPayout === sale.sale_id}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                        >
                          {approvingPayout === sale.sale_id ? "Approving..." : "Approve Payout"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {salesLoading ? "Loading sales..." : "No sales found"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
