import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  Package,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Search,
  User,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

type BatchState = "HARVESTED" | "COLLECTED" | "IN_TRANSIT" | "STORED";

interface BatchResponse {
  batch_id: string;
  farmer_id: string;
  season_id: string;
  qr_code: string;
  initial_weight_kg?: string | null;
  quality_grade?: "A" | "B" | "C" | null;
  current_state?: BatchState | null;
  collecting_agent_id?: string | null;
  crop_type?: string | null;
  created_at: string;
  updated_at: string;
}

interface FarmerResponse {
  farmer_id: string;
  nrc_number: string;
  phone_number: string;
  full_name: string;
  district?: string | null;
  primary_crop?: string | null;
}

interface PaymentResponse {
  payment_id: string;
  farmer_id: string;
  batch_id: string;
  amount_zmw?: string | null;
  payment_status?: string | null;
  market_price_used?: string | null;
  crop_type?: string | null;
  created_at: string;
  updated_at: string;
}

interface CropItem {
  id: string;
  cropType: string;
  weight: number;
  pricePerKg: number;
  totalAmount: number;
}

interface ProcurementReview {
  batch?: BatchResponse;
  farmer?: FarmerResponse;
  expectedWeight: number;
  cropItems: CropItem[];
  totalWeight: number;
  totalAmount: number;
  staffName: string;
  staffRole: string;
  procurementDate: string;
  procurementTime: string;
}

export function ShedProcurement() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [marketPrice, setMarketPrice] = useState("8");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [procurementMode, setProcurementMode] = useState<"batch" | "farmer">("batch");
  const [cropItems, setCropItems] = useState<CropItem[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [review, setReview] = useState<ProcurementReview | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const batchesQuery = useQuery({
    queryKey: ["batches", "shed-ready"],
    queryFn: () =>
      apiRequest<BatchResponse[]>(
        "/web/batches/?limit=200&current_state=IN_TRANSIT",
        { token },
      ),
  });

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list", "shed"],
    queryFn: () =>
      apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", { token }),
  });

  const farmerBatchesQuery = useQuery({
    queryKey: ["batches", "farmer", selectedFarmerId],
    enabled: Boolean(selectedFarmerId),
    queryFn: () =>
      apiRequest<BatchResponse[]>(`/web/batches/?farmer_id=${selectedFarmerId}&limit=50`, { token }),
  });

  const readyBatches = batchesQuery.data ?? [];
  const farmers = farmersQuery.data ?? [];
  const farmerBatches = farmerBatchesQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  // Filter farmers based on search term
  const filteredFarmers = useMemo(() => {
    if (!searchTerm.trim()) return farmers;
    
    const searchLower = searchTerm.toLowerCase();
    return farmers.filter(
      (farmer) =>
        farmer.full_name.toLowerCase().includes(searchLower) ||
        farmer.nrc_number.toLowerCase().includes(searchLower) ||
        farmer.farmer_id.toLowerCase().includes(searchLower) ||
        (farmer.district && farmer.district.toLowerCase().includes(searchLower))
    );
  }, [farmers, searchTerm]);

  // Get the appropriate batch list based on mode
  const displayBatches = procurementMode === "farmer" ? farmerBatches : readyBatches;

  const selectedBatch =
    readyBatches.find((batch) => batch.batch_id === selectedBatchId) ??
    readyBatches[0] ??
    null;

  const selectedFarmer = selectedFarmerId
    ? farmers.find((farmer) => farmer.farmer_id === selectedFarmerId)
    : selectedBatch
    ? farmerById.get(selectedBatch.farmer_id)
    : undefined;

  useEffect(() => {
    if (!selectedBatchId && readyBatches.length > 0 && procurementMode === "batch") {
      setSelectedBatchId(readyBatches[0].batch_id);
    }
  }, [readyBatches, selectedBatchId, procurementMode]);

  // Common crop types for the region
  const cropTypes = [
    "Maize",
    "Soybeans", 
    "Groundnuts",
    "Sunflower",
    "Sorghum",
    "Rice",
    "Wheat",
    "Other"
  ];

  // Get crop type based on mode and selection
  const getCurrentCropType = () => {
    if (procurementMode === "batch" && selectedBatch) {
      return selectedBatch.crop_type || "";
    }
    if (procurementMode === "farmer" && selectedFarmer) {
      return selectedFarmer.primary_crop || "";
    }
    return "";
  };

  // Set crop type when selection changes
  useEffect(() => {
    const currentCrop = getCurrentCropType();
    if (currentCrop && !selectedCrop) {
      setSelectedCrop(currentCrop);
    }
  }, [selectedBatch, selectedFarmer, procurementMode]);

  // Reset crop when mode changes
  const handleModeChange = (mode: "batch" | "farmer") => {
    setProcurementMode(mode);
    setSelectedBatchId(null);
    setSelectedFarmerId(null);
    setReview(null);
    setError("");
    setSuccessMessage("");
    setActualWeight("");
    setSelectedCrop("");
    setCropItems([]);
    setEditingItemId(null);
  };

  // Handle farmer selection
  const handleFarmerSelect = (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setSelectedBatchId(null);
    setReview(null);
    setError("");
    setSuccessMessage("");
    setCropItems([]);
    setEditingItemId(null);
    // Set crop type from farmer's primary crop
    const farmer = farmers.find(f => f.farmer_id === farmerId);
    if (farmer?.primary_crop) {
      setSelectedCrop(farmer.primary_crop);
    }
  };

  // Handle batch selection
  const handleBatchSelect = (batchId: string) => {
    setSelectedBatchId(batchId);
    setReview(null);
    setError("");
    setSuccessMessage("");
    setCropItems([]);
    setEditingItemId(null);
    // Set crop type from batch
    const batch = readyBatches.find(b => b.batch_id === batchId);
    if (batch?.crop_type) {
      setSelectedCrop(batch.crop_type);
    }
  };

  const storeBatchMutation = useMutation({
    mutationFn: (batchId: string) =>
      apiRequest<BatchResponse>(`/web/batches/${batchId}/state`, {
        method: "PATCH",
        token,
        body: { current_state: "STORED" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (payload: {
      farmer_id: string;
      batch_id: string;
      market_price_used?: number;
      crop_type?: string;
    }) =>
      apiRequest<PaymentResponse>("/web/payments/", {
        method: "POST",
        token,
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const expectedWeight = selectedBatch?.initial_weight_kg
    ? Number(selectedBatch.initial_weight_kg)
    : 0;

  const calculateVariance = (actual: number, expected: number) => {
    if (!expected) return 0;
    return ((actual - expected) / expected) * 100;
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) > 5) return "text-destructive";
    if (Math.abs(variance) <= 2) return "text-secondary";
    return "text-accent";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 inline-block ml-1" />;
    if (variance < 0)
      return <TrendingDown className="w-4 h-4 inline-block ml-1" />;
    return <CheckCircle className="w-4 h-4 inline-block ml-1" />;
  };

  // Crop item management functions
  const addCropItem = () => {
    const normalizedWeight = Number(actualWeight);
    const normalizedPrice = Number(marketPrice);

    if (!normalizedWeight || normalizedWeight <= 0) {
      setError("Enter a valid weight before adding crop.");
      return;
    }

    if (!normalizedPrice || normalizedPrice <= 0) {
      setError("Enter a valid market price before adding crop.");
      return;
    }

    if (!selectedCrop.trim()) {
      setError("Select a crop type before adding.");
      return;
    }

    const newItem: CropItem = {
      id: Date.now().toString(),
      cropType: selectedCrop,
      weight: normalizedWeight,
      pricePerKg: normalizedPrice,
      totalAmount: normalizedWeight * normalizedPrice,
    };

    setCropItems([...cropItems, newItem]);
    setActualWeight("");
    setMarketPrice("8");
    setSelectedCrop("");
    setError("");
  };

  const removeCropItem = (id: string) => {
    setCropItems(cropItems.filter(item => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  const updateCropItem = (id: string, updates: Partial<CropItem>) => {
    setCropItems(cropItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // Recalculate total amount if weight or price changed
        if (updates.weight !== undefined || updates.pricePerKg !== undefined) {
          updated.totalAmount = updated.weight * updated.pricePerKg;
        }
        return updated;
      }
      return item;
    }));
  };

  const getTotalWeight = () => {
    return cropItems.reduce((sum, item) => sum + item.weight, 0);
  };

  const getTotalAmount = () => {
    return cropItems.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const handleProcurementReview = () => {
    setError("");
    setSuccessMessage("");

    if (procurementMode === "batch" && !selectedBatch) {
      setError("Select a batch before creating a procurement review.");
      return;
    }

    if (procurementMode === "farmer" && !selectedFarmer) {
      setError("Select a farmer before creating a procurement review.");
      return;
    }

    if (cropItems.length === 0) {
      setError("Add at least one crop item before creating a review.");
      return;
    }

    // Get current date and time
    const now = new Date();
    const procurementDate = now.toLocaleDateString();
    const procurementTime = now.toLocaleTimeString();

    setReview({
      ...(procurementMode === "batch" && { batch: selectedBatch }),
      farmer: selectedFarmer,
      expectedWeight,
      cropItems: [...cropItems],
      totalWeight: getTotalWeight(),
      totalAmount: getTotalAmount(),
      staffName: user?.name || "Unknown Staff",
      staffRole: user?.role || "Staff",
      procurementDate,
      procurementTime,
    });
  };

  const handleFinalSubmit = async () => {
    if (!review) return;

    setError("");
    setSuccessMessage("");

    try {
      let batchId: string;
      let farmerId: string;

      if (procurementMode === "batch" && review.batch) {
        // Batch mode: store the existing batch
        await storeBatchMutation.mutateAsync(review.batch.batch_id);
        batchId = review.batch.batch_id;
        farmerId = review.batch.farmer_id;
      } else if (procurementMode === "farmer" && selectedFarmer) {
        // Farmer mode: create a new batch first (simplified for now)
        // In a real implementation, you'd create a batch first
        batchId = "new-batch-id"; // Placeholder
        farmerId = selectedFarmer.farmer_id;
      } else {
        throw new Error("Invalid procurement mode or missing data");
      }

      // Create payments for each crop item
      const paymentPromises = review.cropItems.map(cropItem => 
        createPaymentMutation.mutateAsync({
          farmer_id: farmerId,
          batch_id: batchId,
          market_price_used: cropItem.pricePerKg,
          crop_type: cropItem.cropType,
        })
      );

      const payments = await Promise.all(paymentPromises);

      setSuccessMessage(
        `Procurement completed and ${payments.length} payment(s) created successfully.`,
      );
      setReview(null);
      setCropItems([]);
      setActualWeight("");
      setSelectedBatchId(null);
      setSelectedFarmerId(null);
      setSelectedCrop("");
    } catch (submitError) {
      console.error("Failed to submit procurement:", submitError);
      setError("Could not submit procurement. Check the data and try again.");
    }
  };

  const isLoading = batchesQuery.isLoading || farmersQuery.isLoading || farmerBatchesQuery.isLoading;
  const isSubmitting =
    storeBatchMutation.isPending || createPaymentMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Shed Procurement</h1>
        <p className="text-muted-foreground">
          Store received batches and create payment records from the web API.
        </p>
        
        {/* Mode Selection */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => handleModeChange("batch")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              procurementMode === "batch"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Batch Mode
          </button>
          <button
            onClick={() => handleModeChange("farmer")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              procurementMode === "farmer"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Farmer Mode
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">
                {procurementMode === "batch" ? "Ready Batches" : "All Farmers"}
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                {procurementMode === "batch" 
                  ? "Current state: IN_TRANSIT" 
                  : "Search and select a farmer to start procurement"
                }
              </p>
            </div>

            {/* Search Input for Farmer Mode */}
            {procurementMode === "farmer" && (
              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search farmers by name, NRC, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : procurementMode === "batch" && readyBatches.length > 0 ? (
                readyBatches.map((batch) => {
                  const farmer = farmerById.get(batch.farmer_id);
                  const isSelected = selectedBatch?.batch_id === batch.batch_id;

                  return (
                    <button
                      key={batch.batch_id}
                      type="button"
                      onClick={() => handleBatchSelect(batch.batch_id)}
                      className={`w-full text-left p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-card-foreground mb-1">
                            {batch.qr_code || batch.batch_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {farmer?.full_name || batch.farmer_id}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">
                          {batch.current_state || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>{batch.initial_weight_kg || "0"} kg</span>
                        <span>Grade {batch.quality_grade || "N/A"}</span>
                      </div>
                    </button>
                  );
                })
              ) : procurementMode === "farmer" && filteredFarmers.length > 0 ? (
                filteredFarmers.map((farmer) => {
                  const isSelected = selectedFarmer?.farmer_id === farmer.farmer_id;

                  return (
                    <button
                      key={farmer.farmer_id}
                      type="button"
                      onClick={() => handleFarmerSelect(farmer.farmer_id)}
                      className={`w-full text-left p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-card-foreground mb-1">
                              {farmer.full_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {farmer.nrc_number}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 ml-11">
                        <span>ID: {farmer.farmer_id}</span>
                        {farmer.district && <span>{farmer.district}</span>}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {procurementMode === "batch" 
                    ? "No batches ready for shed procurement"
                    : searchTerm 
                      ? "No farmers found matching your search"
                      : "No farmers available"
                  }
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl text-card-foreground mb-1">
                {procurementMode === "batch" 
                  ? (selectedBatch?.qr_code || selectedBatch?.batch_id || "No batch selected")
                  : (selectedFarmer?.full_name || "No farmer selected")
                }
              </h2>
              <p className="text-muted-foreground">
                {procurementMode === "batch"
                  ? (selectedFarmer?.full_name || "Select a ready batch to continue")
                  : (selectedFarmer?.nrc_number || "Select a farmer to start procurement")
                }
              </p>
            </div>

            <div className="p-6">
              {(selectedBatch && procurementMode === "batch") || (selectedFarmer && procurementMode === "farmer") ? (
                <>
                  {procurementMode === "batch" && selectedBatch && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Expected Weight
                          </p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          {expectedWeight.toFixed(1)} kg
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          From batch initial weight
                        </p>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-5 h-5 text-secondary" />
                          <p className="text-sm text-muted-foreground">Grade</p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          {selectedBatch.quality_grade || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          QR: {selectedBatch.qr_code}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-accent" />
                          <p className="text-sm text-muted-foreground">Status</p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          {selectedBatch.current_state}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Will update to STORED
                        </p>
                      </div>
                    </div>
                  )}

                  {procurementMode === "farmer" && selectedFarmer && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-5 h-5 text-primary" />
                          <p className="text-sm text-muted-foreground">
                            Farmer ID
                          </p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          {selectedFarmer.farmer_id}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          NRC: {selectedFarmer.nrc_number}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-5 h-5 text-secondary" />
                          <p className="text-sm text-muted-foreground">District</p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          {selectedFarmer.district || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Phone: {selectedFarmer.phone_number || "N/A"}
                        </p>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-accent" />
                          <p className="text-sm text-muted-foreground">Mode</p>
                        </div>
                        <p className="text-2xl text-card-foreground">
                          Farmer Direct
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          New procurement process
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border border-border rounded-lg p-6 bg-muted/10">
                    <h3 className="text-lg text-card-foreground mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-secondary" />
                      Add Crop Items
                    </h3>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <label className="block text-sm text-card-foreground mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          value={actualWeight}
                          onChange={(event) => {
                            setReview(null);
                            setActualWeight(event.target.value);
                          }}
                          className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-card-foreground mb-2">
                          Price (ZMW/kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={marketPrice}
                          onChange={(event) => {
                            setReview(null);
                            setMarketPrice(event.target.value);
                          }}
                          className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-card-foreground mb-2">
                          Crop Type
                        </label>
                        <select
                          value={selectedCrop}
                          onChange={(event) => {
                            setReview(null);
                            setSelectedCrop(event.target.value);
                          }}
                          className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select crop type...</option>
                          {cropTypes.map((crop) => (
                            <option key={crop} value={crop}>
                              {crop}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={addCropItem}
                          className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Crop
                        </button>
                      </div>
                    </div>

                    {cropItems.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-md text-card-foreground mb-3">Added Crop Items</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {cropItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                              <div className="flex-1">
                                <span className="font-medium">{item.cropType}</span>
                                <span className="text-muted-foreground ml-2">
                                  {item.weight}kg × ZMW{item.pricePerKg.toFixed(2)} = ZMW{item.totalAmount.toFixed(2)}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeCropItem(item.id)}
                                className="p-1 text-destructive hover:bg-destructive/10 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span>Total Weight:</span>
                            <span className="font-medium">{getTotalWeight().toFixed(1)} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Amount:</span>
                            <span className="font-medium">ZMW {getTotalAmount().toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mt-4">
                        {error}
                      </p>
                    )}

                    {successMessage && (
                      <p className="rounded-md border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary mt-4">
                        {successMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleProcurementReview}
                      disabled={cropItems.length === 0}
                      className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Procurement ({cropItems.length} crop items)
                    </button>
                  </div>

                  {review && (
                    <div className="bg-card border border-border rounded-lg shadow-sm mt-6">
                      <div className="p-6 border-b border-border">
                        <h3 className="text-xl text-card-foreground mb-1">
                          Purchase Review
                        </h3>
                        <p className="text-muted-foreground">
                          Farmer: {review.farmer?.full_name || (procurementMode === "batch" ? review.batch?.farmer_id : "Unknown")}
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Total Weight
                            </p>
                            <p className="text-2xl text-card-foreground">
                              {review.totalWeight.toFixed(1)} kg
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Variance
                            </p>
                            <p
                              className={`text-2xl ${getVarianceColor(
                                calculateVariance(review.totalWeight, review.expectedWeight),
                              )}`}
                            >
                              {calculateVariance(review.totalWeight, review.expectedWeight).toFixed(1)}%
                              {getVarianceIcon(calculateVariance(review.totalWeight, review.expectedWeight))}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Total Amount
                            </p>
                            <p className="text-2xl text-card-foreground">
                              ZMW {review.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Crop Items
                            </p>
                            <p className="text-2xl text-card-foreground">
                              {review.cropItems.length}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Staff Name
                            </p>
                            <p className="text-lg text-card-foreground">
                              {review.staffName}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Staff Role
                            </p>
                            <p className="text-lg text-card-foreground capitalize">
                              {review.staffRole}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Date & Time
                            </p>
                            <p className="text-sm text-card-foreground">
                              {review.procurementDate}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {review.procurementTime}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-lg text-card-foreground mb-3">Crop Items Breakdown</h4>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {review.cropItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                                {editingItemId === item.id ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={item.weight}
                                      onChange={(e) => updateCropItem(item.id, { weight: Number(e.target.value) })}
                                      className="w-20 px-2 py-1 border border-border rounded"
                                      step="0.1"
                                    />
                                    <span className="text-muted-foreground">kg</span>
                                    <input
                                      type="number"
                                      value={item.pricePerKg}
                                      onChange={(e) => updateCropItem(item.id, { pricePerKg: Number(e.target.value) })}
                                      className="w-20 px-2 py-1 border border-border rounded"
                                      step="0.01"
                                    />
                                    <span className="text-muted-foreground">ZMW/kg</span>
                                    <span className="font-medium">{item.cropType}</span>
                                    <span className="text-muted-foreground">= ZMW{item.totalAmount.toFixed(2)}</span>
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <span className="font-medium">{item.cropType}</span>
                                    <span className="text-muted-foreground ml-2">
                                      {item.weight}kg × ZMW{item.pricePerKg.toFixed(2)} = ZMW{item.totalAmount.toFixed(2)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  {editingItemId === item.id ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        className="p-1 text-secondary hover:bg-secondary/10 rounded"
                                      >
                                        <Save className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingItemId(null);
                                          // Reset to original values by re-creating review
                                          handleProcurementReview();
                                        }}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(item.id)}
                                        className="p-1 text-secondary hover:bg-secondary/10 rounded"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          removeCropItem(item.id);
                                          // Re-create review if items remain
                                          if (cropItems.length > 1) {
                                            setTimeout(() => handleProcurementReview(), 0);
                                          } else {
                                            setReview(null);
                                          }
                                        }}
                                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            // Update review with current crop items before submitting
                            const updatedReview = {
                              ...review,
                              cropItems: [...cropItems],
                              totalWeight: getTotalWeight(),
                              totalAmount: getTotalAmount(),
                            };
                            setReview(updatedReview);
                            handleFinalSubmit();
                          }}
                          disabled={isSubmitting}
                          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : `Submit Procurement (${review.cropItems.length} crops - ZMW ${review.totalAmount.toFixed(2)})`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  {procurementMode === "batch" 
                    ? "No ready batch selected"
                    : "No farmer selected"
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
