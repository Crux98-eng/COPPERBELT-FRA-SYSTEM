import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { 
  Save, 
  ArrowLeft, 
  Search,
  Plus,
  AlertTriangle,
  CheckCircle
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

interface BeneficiaryResponse {
  status_id: string;
  farmer_id: string;
  season_id: string;
  eligibility_state: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
  tagged_by?: string | null;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
}

interface BeneficiaryCreate {
  farmer_id: string;
  season_id: string;
  eligibility_state?: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
}

interface BeneficiaryUpdate {
  eligibility_state?: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
}

export function BeneficiaryForm() {
  const { statusId } = useParams<{ statusId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const isEditing = Boolean(statusId && statusId !== "create");

  const [formData, setFormData] = useState<BeneficiaryCreate>({
    farmer_id: "",
    season_id: "",
    eligibility_state: "PENDING",
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

  const beneficiaryQuery = useQuery({
    queryKey: ["beneficiary", statusId],
    enabled: isEditing && Boolean(statusId && token),
    queryFn: () =>
      apiRequest<BeneficiaryResponse>(`/web/beneficiaries/${statusId}`, { token }),
  });

  const createBeneficiaryMutation = useMutation({
    mutationFn: (data: BeneficiaryCreate) =>
      apiRequest<BeneficiaryResponse>("/web/beneficiaries", {
        method: "POST",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      navigate("/dashboard/beneficiaries");
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

  const updateBeneficiaryMutation = useMutation({
    mutationFn: (data: BeneficiaryUpdate) =>
      apiRequest<BeneficiaryResponse>(`/web/beneficiaries/${statusId}`, {
        method: "PATCH",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["beneficiaries"] });
      queryClient.invalidateQueries({ queryKey: ["beneficiary", statusId] });
      navigate("/dashboard/beneficiaries");
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
  const beneficiary = beneficiaryQuery.data;

  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.nrc_number.includes(searchTerm) ||
    farmer.phone_number.includes(searchTerm)
  );

  useEffect(() => {
    if (beneficiary) {
      setFormData({
        farmer_id: beneficiary.farmer_id,
        season_id: beneficiary.season_id,
        eligibility_state: beneficiary.eligibility_state,
      });
    }
  }, [beneficiary]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.farmer_id) {
      newErrors.farmer_id = "Please select a farmer";
    }

    if (!formData.season_id) {
      newErrors.season_id = "Please select a season";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: BeneficiaryCreate = {
      farmer_id: formData.farmer_id,
      season_id: formData.season_id,
      eligibility_state: formData.eligibility_state,
    };

    if (isEditing) {
      updateBeneficiaryMutation.mutate({
        eligibility_state: formData.eligibility_state,
      } as BeneficiaryUpdate);
    } else {
      createBeneficiaryMutation.mutate(submitData);
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

  if (farmersQuery.isLoading || seasonsQuery.isLoading || (isEditing && beneficiaryQuery.isLoading)) {
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
            to="/dashboard/beneficiaries"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Beneficiaries
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              {isEditing ? "Edit Beneficiary" : "Create New Beneficiary"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update beneficiary eligibility status" : "Add farmer to season eligibility"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg text-card-foreground">Beneficiary Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select farmer and season for eligibility management
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

            {/* ELIGIBILITY STATE */}
            <div>
              <h3 className="text-md text-card-foreground mb-4">Eligibility Status</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: "ELIGIBLE", label: "Eligible", color: "bg-secondary/10 text-secondary" },
                  { value: "INELIGIBLE", label: "Ineligible", color: "bg-destructive/10 text-destructive" },
                  { value: "PENDING", label: "Pending Review", color: "bg-accent/10 text-accent" },
                ].map((status) => (
                  <label
                    key={status.value}
                    className="flex items-center gap-3 p-4 border border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors"
                  >
                    <input
                      type="radio"
                      name="eligibility_state"
                      value={status.value}
                      checked={formData.eligibility_state === status.value}
                      onChange={(e) => {
                        setFormData({ ...formData, eligibility_state: e.target.value as any });
                      }}
                      className="w-4 h-4"
                    />
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${status.color}`}>
                      <CheckCircle className="w-4 h-4" />
                      {status.label}
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
                to="/dashboard/beneficiaries"
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={createBeneficiaryMutation.isPending || updateBeneficiaryMutation.isPending}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createBeneficiaryMutation.isPending || updateBeneficiaryMutation.isPending 
                  ? (isEditing ? "Updating Beneficiary..." : "Creating Beneficiary...")
                  : (isEditing ? "Update Beneficiary" : "Create Beneficiary")
                }
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
