import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { 
  Save, 
  ArrowLeft, 
  Package,
  Scale,
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

interface SeasonResponse {
  season_id: string;
  season_name: string;
}

//  but why ai....
interface BatchResponse {
  batch_id: string;
  farmer_id: string;
  season_id: string;
  qr_code: string;
  initial_weight_kg?: string | null;
  quality_grade?: "A" | "B" | "C" | null;
  current_state?: "HARVESTED" | "COLLECTED" | "IN_TRANSIT" | "STORED" | null;
  collecting_agent_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface BatchCreate {
  farmer_id: string;
  season_id: string;
  qr_code?: string;
  initial_weight_kg?: number;
  quality_grade?: "A" | "B" | "C";
}

interface BatchUpdate {
  farmer_id?: string;
  season_id?: string;
  qr_code?: string;
  initial_weight_kg?: number;
  quality_grade?: "A" | "B" | "C";
}

export function BatchForm() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const isEditing = Boolean(batchId && batchId !== "create");

  const [formData, setFormData] = useState<BatchCreate>({
    farmer_id: "",
    season_id: "",
    qr_code: "",
    initial_weight_kg: undefined,
    quality_grade: "A",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", { token }),
  });

  const seasonsQuery = useQuery({
    queryKey: ["seasons", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<SeasonResponse[]>("/web/seasons/?limit=200", { token }),
  });

  const batchQuery = useQuery({
    queryKey: ["batch", batchId],
    enabled: isEditing && Boolean(batchId && token),
    queryFn: () =>
      apiRequest<BatchResponse>(`/web/batches/${batchId}`, { token }),
  });

  const createBatchMutation = useMutation({
    mutationFn: (data: BatchCreate) =>
      apiRequest<BatchResponse>("/web/batches", {
        method: "POST",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      navigate("/dashboard/batches");
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

  const updateBatchMutation = useMutation({
    mutationFn: (data: BatchUpdate) =>
      apiRequest<BatchResponse>(`/web/batches/${batchId}`, {
        method: "PUT",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
      queryClient.invalidateQueries({ queryKey: ["batch", batchId] });
      navigate("/dashboard/batches");
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
  const seasons = seasonsQuery.data ?? [];
  const batch = batchQuery.data;

  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.nrc_number.includes(searchTerm) ||
    farmer.phone_number.includes(searchTerm)
  );

  useEffect(() => {
    if (batch) {
      setFormData({
        farmer_id: batch.farmer_id,
        season_id: batch.season_id,
        qr_code: batch.qr_code,
        initial_weight_kg: batch.initial_weight_kg ? parseFloat(batch.initial_weight_kg) : undefined,
        quality_grade: batch.quality_grade || "A",
      });
    }
  }, [batch]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.farmer_id) {
      newErrors.farmer_id = "Please select a farmer";
    }

    if (!formData.season_id) {
      newErrors.season_id = "Please select a season";
    }

    if (formData.initial_weight_kg !== undefined && (formData.initial_weight_kg <= 0 || formData.initial_weight_kg > 100000)) {
      newErrors.initial_weight_kg = "Weight must be between 0 and 100,000 kg";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: BatchCreate | BatchUpdate = {};

    if (formData.qr_code.trim()) {
      submitData.qr_code = formData.qr_code.trim();
    }

    if (formData.initial_weight_kg !== undefined) {
      submitData.initial_weight_kg = formData.initial_weight_kg;
    }

    if (formData.quality_grade) {
      submitData.quality_grade = formData.quality_grade;
    }

    if (isEditing) {
      updateBatchMutation.mutate(submitData as BatchUpdate);
    } else {
      submitData.farmer_id = formData.farmer_id;
      submitData.season_id = formData.season_id;
      createBatchMutation.mutate(submitData as BatchCreate);
    }
  };

  const handleFarmerSelect = (farmer: FarmerResponse) => {
    setFormData({
      ...formData,
      farmer_id: farmer.farmer_id,
    });
    setSearchTerm("");
    setErrors({ ...errors, farmer_id: "" });
  };

  const handleSeasonSelect = (season: SeasonResponse) => {
    setFormData({
      ...formData,
      season_id: season.season_id,
    });
    setErrors({ ...errors, season_id: "" });
  };

  const generateQRCode = () => {
    const qrCode = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    setFormData({
      ...formData,
      qr_code: qrCode,
    });
  };

  if (farmersQuery.isLoading || seasonsQuery.isLoading || (isEditing && batchQuery.isLoading)) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
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
            to="/dashboard/batches"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              {isEditing ? "Edit Batch" : "Create New Batch"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update batch information" : "Register new agricultural batch"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg text-card-foreground">Batch Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter batch details and assign to farmer and season
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
                            setFormData({ ...formData, farmer_id: "" });
                            setErrors({ ...errors, farmer_id: "" });
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

              {/* SEASON SELECTION */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Select Season *
                </label>
                <select
                  value={formData.season_id}
                  onChange={(e) => {
                    setFormData({ ...formData, season_id: e.target.value });
                    setErrors({ ...errors, season_id: "" });
                  }}
                  className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.season_id ? "border-destructive" : "border-border"
                  }`}
                >
                  <option value="">Select a season</option>
                  {seasons.map((season) => (
                    <option key={season.season_id} value={season.season_id}>
                      {season.season_name}
                    </option>
                  ))}
                </select>

                {errors.season_id && (
                  <p className="text-sm text-destructive mt-1">{errors.season_id}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* QR CODE */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  QR Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.qr_code}
                    onChange={(e) => {
                      setFormData({ ...formData, qr_code: e.target.value });
                    }}
                    className="flex-1 px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="BATCH-001"
                  />
                  <button
                    type="button"
                    onClick={generateQRCode}
                    className="px-4 py-3 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* INITIAL WEIGHT */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Initial Weight (kg)
                </label>
                <div className="relative">
                  <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100000"
                    value={formData.initial_weight_kg || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        initial_weight_kg: parseFloat(e.target.value) || undefined,
                      });
                      setErrors({ ...errors, initial_weight_kg: "" });
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.initial_weight_kg ? "border-destructive" : "border-border"
                    }`}
                    placeholder="1500.5"
                  />
                </div>
                {errors.initial_weight_kg && (
                  <p className="text-sm text-destructive mt-1">{errors.initial_weight_kg}</p>
                )}
              </div>
            </div>

            {/* QUALITY GRADE */}
            <div>
              <h3 className="text-md text-card-foreground mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Quality Grade
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "A", label: "Grade A - Premium", color: "bg-secondary/10 text-secondary" },
                  { value: "B", label: "Grade B - Standard", color: "bg-accent/10 text-accent" },
                  { value: "C", label: "Grade C - Basic", color: "bg-destructive/10 text-destructive" },
                ].map((grade) => (
                  <label
                    key={grade.value}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <input
                      type="radio"
                      name="quality_grade"
                      value={grade.value}
                      checked={formData.quality_grade === grade.value}
                      onChange={(e) => {
                        setFormData({ ...formData, quality_grade: e.target.value as any });
                      }}
                      className="w-4 h-4"
                    />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${grade.color}`}>
                      {grade.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

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
                to="/dashboard/batches"
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createBatchMutation.isPending || updateBatchMutation.isPending}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createBatchMutation.isPending || updateBatchMutation.isPending 
                  ? (isEditing ? "Updating Batch..." : "Creating Batch...")
                  : (isEditing ? "Update Batch" : "Create Batch")
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
