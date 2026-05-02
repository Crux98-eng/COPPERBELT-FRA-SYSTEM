import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { 
  MapPin, 
  Save, 
  ArrowLeft, 
  Plus,
  Search
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

interface FarmCreate {
  farmer_id: string;
  gps_latitude: number;
  gps_longitude: number;
  size_hectares?: number;
  primary_crop?: string;
}

export function FarmCreate() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<FarmCreate>({
    farmer_id: "",
    gps_latitude: 0,
    gps_longitude: 0,
    size_hectares: undefined,
    primary_crop: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", { token }),
  });

  const createFarmMutation = useMutation({
    mutationFn: (data: FarmCreate) =>
      apiRequest<any>("/web/farms", {
        method: "POST",
        token,
        body: data,
      }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      navigate(`/dashboard/farms/${response.farm_id}`);
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
  
  const filteredFarmers = farmers.filter(farmer =>
    farmer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.nrc_number.includes(searchTerm) ||
    farmer.phone_number.includes(searchTerm)
  );

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.farmer_id) {
      newErrors.farmer_id = "Please select a farmer";
    }

    if (!formData.gps_latitude || formData.gps_latitude < -90 || formData.gps_latitude > 90) {
      newErrors.gps_latitude = "Please enter a valid latitude (-90 to 90)";
    }

    if (!formData.gps_longitude || formData.gps_longitude < -180 || formData.gps_longitude > 180) {
      newErrors.gps_longitude = "Please enter a valid longitude (-180 to 180)";
    }

    if (formData.size_hectares !== undefined && (formData.size_hectares <= 0 || formData.size_hectares > 10000)) {
      newErrors.size_hectares = "Farm size must be between 0 and 10000 hectares";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData: FarmCreate = {
      farmer_id: formData.farmer_id,
      gps_latitude: formData.gps_latitude,
      gps_longitude: formData.gps_longitude,
    };

    if (formData.size_hectares !== undefined) {
      submitData.size_hectares = formData.size_hectares;
    }

    if (formData.primary_crop?.trim()) {
      submitData.primary_crop = formData.primary_crop.trim();
    }

    createFarmMutation.mutate(submitData);
  };

  const handleFarmerSelect = (farmer: FarmerResponse) => {
    setFormData({
      ...formData,
      farmer_id: farmer.farmer_id,
    });
    setSearchTerm("");
    setErrors({ ...errors, farmer_id: "" });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            gps_latitude: position.coords.latitude,
            gps_longitude: position.coords.longitude,
          });
          setErrors({ ...errors, gps_latitude: "", gps_longitude: "" });
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrors({ ...errors, gps_location: "Unable to get current location" });
        }
      );
    } else {
      setErrors({ ...errors, gps_location: "Geolocation is not supported by this browser" });
    }
  };

  if (farmersQuery.isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <Skeleton className="h-6 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            to="/dashboard/farms"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Farms
          </Link>
          <div>
            <h1 className="text-3xl text-foreground mb-1">
              Create New Farm
            </h1>
            <p className="text-muted-foreground">
              Register a new farm for an existing farmer
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FARMER SELECTION */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Select Farmer</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the farmer who owns this farm
              </p>
            </div>

            <div className="p-4">
              {/* SEARCH */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, NRC, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* SELECTED FARMER */}
              {formData.farmer_id && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-md">
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
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredFarmers.map((farmer) => (
                  <button
                    key={farmer.farmer_id}
                    type="button"
                    onClick={() => handleFarmerSelect(farmer)}
                    className="w-full text-left p-3 border border-border rounded-md hover:bg-muted/20 transition-colors"
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
                <p className="text-sm text-destructive mt-2">{errors.farmer_id}</p>
              )}
            </div>
          </div>
        </div>

        {/* FARM DETAILS */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Farm Details</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter the farm location and characteristics
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* GPS LOCATION */}
              <div>
                <h3 className="text-md text-card-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  GPS Location
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.gps_latitude}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          gps_latitude: parseFloat(e.target.value) || 0,
                        });
                        setErrors({ ...errors, gps_latitude: "", gps_location: "" });
                      }}
                      className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.gps_latitude ? "border-destructive" : "border-border"
                      }`}
                      placeholder="-13.9893"
                    />
                    {errors.gps_latitude && (
                      <p className="text-sm text-destructive mt-1">{errors.gps_latitude}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.gps_longitude}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          gps_longitude: parseFloat(e.target.value) || 0,
                        });
                        setErrors({ ...errors, gps_longitude: "", gps_location: "" });
                      }}
                      className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.gps_longitude ? "border-destructive" : "border-border"
                      }`}
                      placeholder="30.8256"
                    />
                    {errors.gps_longitude && (
                      <p className="text-sm text-destructive mt-1">{errors.gps_longitude}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="mt-3 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                >
                  Use Current Location
                </button>

                {errors.gps_location && (
                  <p className="text-sm text-destructive mt-2">{errors.gps_location}</p>
                )}
              </div>

              {/* FARM CHARACTERISTICS */}
              <div>
                <h3 className="text-md text-card-foreground mb-4">Farm Characteristics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Farm Size (hectares)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10000"
                      value={formData.size_hectares || ""}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          size_hectares: parseFloat(e.target.value) || undefined,
                        });
                        setErrors({ ...errors, size_hectares: "" });
                      }}
                      className={`w-full px-4 py-3 border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary ${
                        errors.size_hectares ? "border-destructive" : "border-border"
                      }`}
                      placeholder="5.5"
                    />
                    {errors.size_hectares && (
                      <p className="text-sm text-destructive mt-1">{errors.size_hectares}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Primary Crop
                    </label>
                    <input
                      type="text"
                      value={formData.primary_crop}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          primary_crop: e.target.value,
                        });
                      }}
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Maize"
                    />
                  </div>
                </div>
              </div>

              {/* GENERAL ERROR */}
              {errors.general && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{errors.general}</p>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <div className="flex gap-4">
                <Link
                  to="/dashboard/farms"
                  className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={createFarmMutation.isPending}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {createFarmMutation.isPending ? "Creating Farm..." : "Create Farm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
