import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { 
  Save, 
  ArrowLeft, 
  DollarSign,
  Package,
  Search,
  Plus,
  AlertTriangle
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface FarmerResponse {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  phone_number: string;
  district?: string | null;
}

interface BatchResponse {
  batch_id: string;
  qr_code: string;
  initial_weight_kg?: string | null;
  quality_grade?: "A" | "B" | "C" | null;
  farmer_id: string;
}

interface PaymentResponse {
  payment_id: string;
  farmer_id: string;
  batch_id: string;
  amount_zmw?: string | null;
  payment_status?: "CREATED" | "APPROVED" | "SENT" | "CONFIRMED" | "FAILED" | "MANUAL_REVIEW" | null;
  approved_by?: string | null;
  market_price_used?: string | null;
  created_at: string;
  updated_at: string;
}

interface PaymentCreate {
  farmer_id: string;
  batch_id: string;
  market_price_used?: number;
}

interface PaymentUpdate {
  farmer_id?: string;
  batch_id?: string;
  market_price_used?: number;
}

export function PaymentForm() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const isEditing = Boolean(paymentId && paymentId !== "create");

  const [formData, setFormData] = useState<PaymentCreate>({
    farmer_id: "",
    batch_id: "",
    market_price_used: undefined,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", { token }),
  });

  const batchesQuery = useQuery({
    queryKey: ["batches", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<BatchResponse[]>("/web/batches/?limit=200", { token }),
  });

  const paymentQuery = useQuery({
    queryKey: ["payment", paymentId],
    enabled: isEditing && Boolean(paymentId && token),
    queryFn: () =>
      apiRequest<PaymentResponse>(`/web/payments/${paymentId}`, { token }),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentCreate) =>
      apiRequest<PaymentResponse>("/web/payments", {
        method: "POST",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      navigate("/dashboard/payments");
    },
    onError: (error: ApiError) => {
      if (error.data && typeof error.data === "object") {
        const errorMap: Record<string, string> = {};
        Object.entries(error.data).forEach(([key, value]) => {
          errorMap[key] = Array.isArray(value) ? value.join(", ") : String(value);
        });
        setErrors(errorMap);
      } else {
        setErrors({ general: error.message });
      }
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: (data: PaymentUpdate) =>
      apiRequest<PaymentResponse>(`/web/payments/${paymentId}`, {
        method: "PUT",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["payment", paymentId] });
      navigate("/dashboard/payments");
    },
    onError: (error: ApiError) => {
      if (error.data && typeof error.data === "object") {
        const errorMap: Record<string, string> = {};
        Object.entries(error.data).forEach(([key, value]) => {
          errorMap[key] = Array.isArray(value) ? value.join(", ") : String(value);
        });
        setErrors(errorMap);
      } else {
        setErrors({ general: error.message });
      }
    },
  });

  const farmers = farmersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const payment = paymentQuery.data;

  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.nrc_number.includes(searchTerm) ||
    farmer.phone_number.includes(searchTerm)
  );

  const availableBatches = formData.farmer_id 
    ? batches.filter(batch => batch.farmer_id === formData.farmer_id)
    : [];

  useEffect(() => {
    if (payment) {
      setFormData({
        farmer_id: payment.farmer_id,
        batch_id: payment.batch_id,
        market_price_used: payment.market_price_used ? parseFloat(payment.market_price_used) : undefined,
      });
    }
  }, [payment]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.farmer_id) {
      newErrors.farmer_id = "Please select a farmer";
    }

    if (!formData.batch_id) {
      newErrors.batch_id = "Please select a batch";
    }

    if (formData.market_price_used !== undefined && (formData.market_price_used < 0 || formData.market_price_used > 1000)) {
      newErrors.market_price_used = "Market price must be between 0 and 1,000 ZMW/kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: PaymentCreate | PaymentUpdate = {};

    if (formData.market_price_used !== undefined) {
      submitData.market_price_used = formData.market_price_used;
    }

    if (isEditing) {
      updatePaymentMutation.mutate(submitData as PaymentUpdate);
    } else {
      submitData.farmer_id = formData.farmer_id;
      submitData.batch_id = formData.batch_id;
      createPaymentMutation.mutate(submitData as PaymentCreate);
    }
  };

  const handleFarmerSelect = (farmer: FarmerResponse) => {
    setFormData({
      ...formData,
      farmer_id: farmer.farmer_id,
      batch_id: "", // Reset batch when farmer changes
    });
    setSearchTerm("");
    setErrors({ ...errors, farmer_id: "", batch_id: "" });
  };

  const handleBatchSelect = (batch: BatchResponse) => {
    setFormData({
      ...formData,
      batch_id: batch.batch_id,
    });
    setErrors({ ...errors, batch_id: "" });
  };

  if (farmersQuery.isLoading || batchesQuery.isLoading || (isEditing && paymentQuery.isLoading)) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard/payments"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payments
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              {isEditing ? "Edit Payment" : "Create New Payment"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update payment information" : "Create payment for farmer batch"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg text-card-foreground">Payment Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select farmer, batch, and set payment parameters
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FARMER SELECTION */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Select Farmer *
                </label>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by name, NRC, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* SELECTED FARMER */}
                  {formData.farmer_id && (
                    <div className="mb-3 p-3 bg-primary/5 border border-primary/20 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-card-foreground">
                            {farmers.find(f => f.farmer_id === formData.farmer_id)?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {farmers.find(f => f.farmer_id === formData.farmer_id)?.nrc_number}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, farmer_id: "", batch_id: "" });
                            setErrors({ ...errors, farmer_id: "", batch_id: "" });
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Plus className="w-4 h-4 rotate-45" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* FARMER LIST */}
                  <div className="max-h-48 overflow-y-auto border border-border rounded-md">
                    {filteredFarmers.map((farmer) => (
                      <button
                        key={farmer.farmer_id}
                        type="button"
                        onClick={() => handleFarmerSelect(farmer)}
                        className="w-full text-left p-3 hover:bg-muted/20 transition-colors border-b border-border last:border-b-0"
                      >
                        <p className="text-sm font-medium text-card-foreground">
                          {farmer.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {farmer.nrc_number} • {farmer.phone_number}
                        </p>
                        {farmer.district && (
                          <p className="text-xs text-muted-foreground">
                            {farmer.district}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>

                  {errors.farmer_id && (
                    <p className="text-sm text-destructive mt-1">{errors.farmer_id}</p>
                  )}
                </div>
              </div>

              {/* BATCH SELECTION */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Select Batch *
                </label>
                <select
                  value={formData.batch_id}
                  onChange={(e) => {
                    setFormData({ ...formData, batch_id: e.target.value });
                    setErrors({ ...errors, batch_id: "" });
                  }}
                  disabled={!formData.farmer_id}
                  className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.batch_id ? "border-destructive" : "border-border"
                  } ${!formData.farmer_id ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <option value="">
                    {formData.farmer_id ? "Select a batch" : "Select a farmer first"}
                  </option>
                  {availableBatches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.qr_code} • {batch.initial_weight_kg ? `${batch.initial_weight_kg} kg` : "N/A"}
                      {batch.quality_grade && ` • Grade ${batch.quality_grade}`}
                    </option>
                  ))}
                </select>

                {errors.batch_id && (
                  <p className="text-sm text-destructive mt-1">{errors.batch_id}</p>
                )}
              </div>
            </div>

            {/* MARKET PRICE */}
            <div>
              <h3 className="text-md text-card-foreground mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Market Price per kg (ZMW)
              </h3>
              
              <div className="max-w-md">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  value={formData.market_price_used || ""}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      market_price_used: parseFloat(e.target.value) || undefined,
                    });
                    setErrors({ ...errors, market_price_used: "" });
                  }}
                  className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.market_price_used ? "border-destructive" : "border-border"
                  }`}
                  placeholder="8.50"
                />
                {errors.market_price_used && (
                  <p className="text-sm text-destructive mt-1">{errors.market_price_used}</p>
                )}
              </div>
            </div>

            {/* SELECTED BATCH INFO */}
            {formData.batch_id && (
              <div>
                <h3 className="text-md text-card-foreground mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-accent" />
                  Selected Batch Information
                </h3>
                
                <div className="bg-muted/10 border border-border rounded-md p-4">
                  {(() => {
                    const batch = availableBatches.find(b => b.batch_id === formData.batch_id);
                    if (!batch) return null;
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">QR Code</p>
                          <p className="text-card-foreground font-medium">{batch.qr_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Weight</p>
                          <p className="text-card-foreground font-medium">
                            {batch.initial_weight_kg ? `${batch.initial_weight_kg} kg` : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Quality Grade</p>
                          <p className="text-card-foreground font-medium">
                            {batch.quality_grade || "N/A"}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* GENERAL ERROR */}
            {errors.general && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              </div>
            )}

            {/* SUBMIT BUTTONS */}
            <div className="flex gap-4 pt-6 border-t border-border">
              <Link
                to="/dashboard/payments"
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createPaymentMutation.isPending || updatePaymentMutation.isPending}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createPaymentMutation.isPending || updatePaymentMutation.isPending 
                  ? (isEditing ? "Updating Payment..." : "Creating Payment...")
                  : (isEditing ? "Update Payment" : "Create Payment")
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
