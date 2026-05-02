import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { 
  Save, 
  ArrowLeft, 
  Calendar,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface SeasonResponse {
  season_id: string;
  season_name: string;
  farmer_contribution?: string | null;
  market_price_per_kg?: string | null;
  redemption_window_start?: string | null;
  redemption_window_end?: string | null;
  created_at: string;
  updated_at: string;
}

interface SeasonCreate {
  season_name: string;
  farmer_contribution?: number;
  market_price_per_kg?: number;
  redemption_window_start?: string;
  redemption_window_end?: string;
}

interface SeasonUpdate {
  season_name?: string;
  farmer_contribution?: number;
  market_price_per_kg?: number;
  redemption_window_start?: string;
  redemption_window_end?: string;
}

export function SeasonForm() {
  const { seasonId } = useParams<{ seasonId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const isEditing = Boolean(seasonId && seasonId !== "create");

  const [formData, setFormData] = useState<SeasonCreate>({
    season_name: "",
    farmer_contribution: undefined,
    market_price_per_kg: undefined,
    redemption_window_start: "",
    redemption_window_end: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const seasonQuery = useQuery({
    queryKey: ["season", seasonId],
    enabled: isEditing && Boolean(seasonId && token),
    queryFn: () =>
      apiRequest<SeasonResponse>(`/web/seasons/${seasonId}`, { token }),
  });

  const createSeasonMutation = useMutation({
    mutationFn: (data: SeasonCreate) =>
      apiRequest<SeasonResponse>("/web/seasons", {
        method: "POST",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      navigate("/dashboard/seasons");
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

  const updateSeasonMutation = useMutation({
    mutationFn: (data: SeasonUpdate) =>
      apiRequest<SeasonResponse>(`/web/seasons/${seasonId}`, {
        method: "PUT",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      queryClient.invalidateQueries({ queryKey: ["season", seasonId] });
      navigate("/dashboard/seasons");
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

  const season = seasonQuery.data;

  useEffect(() => {
    if (season) {
      setFormData({
        season_name: season.season_name,
        farmer_contribution: season.farmer_contribution ? parseFloat(season.farmer_contribution) : undefined,
        market_price_per_kg: season.market_price_per_kg ? parseFloat(season.market_price_per_kg) : undefined,
        redemption_window_start: season.redemption_window_start ? season.redemption_window_start.split('T')[0] : "",
        redemption_window_end: season.redemption_window_end ? season.redemption_window_end.split('T')[0] : "",
      });
    }
  }, [season]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.season_name.trim()) {
      newErrors.season_name = "Season name is required";
    }

    if (formData.farmer_contribution !== undefined && (formData.farmer_contribution < 0 || formData.farmer_contribution > 1000000)) {
      newErrors.farmer_contribution = "Farmer contribution must be between 0 and 1,000,000 ZMW";
    }

    if (formData.market_price_per_kg !== undefined && (formData.market_price_per_kg < 0 || formData.market_price_per_kg > 1000)) {
      newErrors.market_price_per_kg = "Market price must be between 0 and 1,000 ZMW/kg";
    }

    if (formData.redemption_window_start && formData.redemption_window_end) {
      const startDate = new Date(formData.redemption_window_start);
      const endDate = new Date(formData.redemption_window_end);
      
      if (startDate >= endDate) {
        newErrors.redemption_window = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: SeasonCreate | SeasonUpdate = {
      season_name: formData.season_name.trim(),
    };

    if (formData.farmer_contribution !== undefined) {
      submitData.farmer_contribution = formData.farmer_contribution;
    }

    if (formData.market_price_per_kg !== undefined) {
      submitData.market_price_per_kg = formData.market_price_per_kg;
    }

    if (formData.redemption_window_start) {
      submitData.redemption_window_start = formData.redemption_window_start;
    }

    if (formData.redemption_window_end) {
      submitData.redemption_window_end = formData.redemption_window_end;
    }

    if (isEditing) {
      updateSeasonMutation.mutate(submitData as SeasonUpdate);
    } else {
      createSeasonMutation.mutate(submitData as SeasonCreate);
    }
  };

  const isLoading = seasonQuery.isLoading;
  const isSubmitting = createSeasonMutation.isPending || updateSeasonMutation.isPending;

  if (isEditing && isLoading) {
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
            to="/dashboard/seasons"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Seasons
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              {isEditing ? "Edit Season" : "Create New Season"}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? "Update season parameters" : "Configure new agricultural season"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg text-card-foreground">Season Information</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Basic details and pricing parameters
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Season Name *
                </label>
                <input
                  type="text"
                  value={formData.season_name}
                  onChange={(e) => {
                    setFormData({ ...formData, season_name: e.target.value });
                    setErrors({ ...errors, season_name: "" });
                  }}
                  className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.season_name ? "border-destructive" : "border-border"
                  }`}
                  placeholder="2024-2025 Maize Season"
                />
                {errors.season_name && (
                  <p className="text-sm text-destructive mt-1">{errors.season_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Market Price per kg (ZMW)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000"
                    value={formData.market_price_per_kg || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        market_price_per_kg: parseFloat(e.target.value) || undefined,
                      });
                      setErrors({ ...errors, market_price_per_kg: "" });
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.market_price_per_kg ? "border-destructive" : "border-border"
                    }`}
                    placeholder="8.50"
                  />
                </div>
                {errors.market_price_per_kg && (
                  <p className="text-sm text-destructive mt-1">{errors.market_price_per_kg}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  Farmer Contribution (ZMW)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1000000"
                    value={formData.farmer_contribution || ""}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        farmer_contribution: parseFloat(e.target.value) || undefined,
                      });
                      setErrors({ ...errors, farmer_contribution: "" });
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.farmer_contribution ? "border-destructive" : "border-border"
                    }`}
                    placeholder="500.00"
                  />
                </div>
                {errors.farmer_contribution && (
                  <p className="text-sm text-destructive mt-1">{errors.farmer_contribution}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-md text-card-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Redemption Window
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-card-foreground mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.redemption_window_start}
                    onChange={(e) => {
                      setFormData({ ...formData, redemption_window_start: e.target.value });
                      setErrors({ ...errors, redemption_window: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.redemption_window ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm text-card-foreground mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.redemption_window_end}
                    onChange={(e) => {
                      setFormData({ ...formData, redemption_window_end: e.target.value });
                      setErrors({ ...errors, redemption_window: "" });
                    }}
                    className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.redemption_window ? "border-destructive" : "border-border"
                    }`}
                  />
                </div>
              </div>

              {errors.redemption_window && (
                <p className="text-sm text-destructive mt-1">{errors.redemption_window}</p>
              )}
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
                to="/dashboard/seasons"
                className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? (isEditing ? "Updating Season..." : "Creating Season...") : (isEditing ? "Update Season" : "Create Season")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
