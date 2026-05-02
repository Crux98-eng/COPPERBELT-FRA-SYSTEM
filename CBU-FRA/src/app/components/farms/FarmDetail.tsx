import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { 
  MapPin, 
  Edit, 
  Save, 
  X, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft 
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface FarmResponse {
  farm_id: string;
  farmer_id: string;
  gps_latitude: string;
  gps_longitude: string;
  size_hectares?: string | null;
  primary_crop?: string | null;
  verification_status?: "PENDING" | "VERIFIED" | "REJECTED" | null;
  created_at: string;
  updated_at: string;
}

interface FarmerResponse {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  phone_number: string;
  district?: string | null;
  created_at: string;
}

interface FarmUpdate {
  gps_latitude?: number;
  gps_longitude?: number;
  size_hectares?: number;
  primary_crop?: string;
}

export function FarmDetail() {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<FarmUpdate>({
    gps_latitude: undefined,
    gps_longitude: undefined,
    size_hectares: undefined,
    primary_crop: "",
  });

  const farmQuery = useQuery({
    queryKey: ["farm", farmId],
    enabled: Boolean(farmId && token),
    queryFn: () =>
      apiRequest<FarmResponse>(`/web/farms/${farmId}`, { token }),
  });

  const farmerQuery = useQuery({
    queryKey: ["farmer", farmQuery.data?.farmer_id],
    enabled: Boolean(farmQuery.data?.farmer_id && token),
    queryFn: () =>
      apiRequest<FarmerResponse>(`/web/farmers/${farmQuery.data?.farmer_id}`, { token }),
  });

  const updateFarmMutation = useMutation({
    mutationFn: (data: FarmUpdate) =>
      apiRequest<FarmResponse>(`/web/farms/${farmId}`, {
        method: "PUT",
        token,
        body: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      setIsEditing(false);
    },
  });

  const verifyFarmMutation = useMutation({
    mutationFn: (status: "VERIFIED" | "REJECTED") =>
      apiRequest<FarmResponse>(`/web/farms/${farmId}/verify`, {
        method: "PATCH",
        token,
        body: { verification_status: status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", farmId] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });

  const farm = farmQuery.data;
  const farmer = farmerQuery.data;

  useEffect(() => {
    if (farm) {
      setFormData({
        gps_latitude: parseFloat(farm.gps_latitude) || undefined,
        gps_longitude: parseFloat(farm.gps_longitude) || undefined,
        size_hectares: farm.size_hectares ? parseFloat(farm.size_hectares) : undefined,
        primary_crop: farm.primary_crop || "",
      });
    }
  }, [farm]);

  const handleSave = () => {
    if (!farm) return;

    const updateData: FarmUpdate = {};
    
    if (formData.gps_latitude !== undefined && formData.gps_latitude !== parseFloat(farm.gps_latitude)) {
      updateData.gps_latitude = formData.gps_latitude;
    }
    
    if (formData.gps_longitude !== undefined && formData.gps_longitude !== parseFloat(farm.gps_longitude)) {
      updateData.gps_longitude = formData.gps_longitude;
    }
    
    if (formData.size_hectares !== undefined && formData.size_hectares !== parseFloat(farm.size_hectares || "0")) {
      updateData.size_hectares = formData.size_hectares;
    }
    
    if (formData.primary_crop !== farm.primary_crop) {
      updateData.primary_crop = formData.primary_crop || undefined;
    }

    if (Object.keys(updateData).length > 0) {
      updateFarmMutation.mutate(updateData);
    } else {
      setIsEditing(false);
    }
  };

  const handleVerify = (status: "VERIFIED" | "REJECTED") => {
    const action = status === "VERIFIED" ? "verify" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this farm?`
    );

    if (confirmed) {
      verifyFarmMutation.mutate(status);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Verified
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            Rejected
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
            <AlertTriangle className="w-4 h-4" />
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-muted/10 text-muted-foreground rounded-full text-sm">
            Unknown
          </span>
        );
    }
  };

  if (farmQuery.isLoading || farmerQuery?.isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl text-foreground mb-4">Farm not found</h1>
          <Link
            to="/dashboard/farms"
            className="text-primary hover:underline"
          >
            ← Back to Farms
          </Link>
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
            to="/dashboard/farms"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Farms
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              Farm Details
            </h1>
            <p className="text-muted-foreground">
              {farmer?.full_name || "Unknown Farmer"} • {farm.farm_id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {farm.verification_status === "PENDING" && (
            <>
              <button
                type="button"
                onClick={() => handleVerify("VERIFIED")}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Verify
              </button>
              <button
                type="button"
                onClick={() => handleVerify("REJECTED")}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Reject
              </button>
            </>
          )}

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data
                  if (farm) {
                    setFormData({
                      gps_latitude: parseFloat(farm.gps_latitude) || undefined,
                      gps_longitude: parseFloat(farm.gps_longitude) || undefined,
                      size_hectares: farm.size_hectares ? parseFloat(farm.size_hectares) : undefined,
                      primary_crop: farm.primary_crop || "",
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateFarmMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {updateFarmMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FARMER INFO */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Farmer Information</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-card-foreground font-medium">
                  {farmer?.full_name || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">NRC Number</p>
                <p className="text-card-foreground">
                  {farmer?.nrc_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="text-card-foreground">
                  {farmer?.phone_number || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">District</p>
                <p className="text-card-foreground">
                  {farmer?.district || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verification Status</p>
                <div className="mt-1">
                  {getStatusBadge(farm.verification_status)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FARM DETAILS */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Farm Details</h2>
            </div>
            <div className="p-6">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      GPS Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.gps_latitude || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gps_latitude: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      GPS Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.gps_longitude || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gps_longitude: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Farm Size (hectares)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.size_hectares || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          size_hectares: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Primary Crop
                    </label>
                    <input
                      type="text"
                      value={formData.primary_crop}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          primary_crop: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">GPS Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <p className="text-card-foreground">
                        {farm.gps_latitude}, {farm.gps_longitude}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Farm Size</p>
                    <p className="text-card-foreground">
                      {farm.size_hectares ? `${farm.size_hectares} hectares` : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Primary Crop</p>
                    <p className="text-card-foreground">
                      {farm.primary_crop || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Created Date</p>
                    <p className="text-card-foreground">
                      {new Date(farm.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
                    <p className="text-card-foreground">
                      {new Date(farm.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
