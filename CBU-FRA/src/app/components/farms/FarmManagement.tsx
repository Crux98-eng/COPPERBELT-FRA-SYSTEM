import { useState, useMemo,useEffect } from "react";
import { Link } from "react-router";
import { Search, Filter, CheckCircle, MapPin, Plus, Edit, Trash2 } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  district?: string | null;
}

interface FarmsListResponse {
  items: FarmResponse[];
  total: number;
  skip: number;
  limit: number;
}

const verificationStatusColors = {
  PENDING: "bg-accent/10 text-accent",
  VERIFIED: "bg-secondary/10 text-secondary",
  REJECTED: "bg-destructive/10 text-destructive",
};

export function FarmManagement() {
    const { token } = useAuth();

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const farmsQuery = useQuery({
    queryKey: [
      "farms",
      "list",
      page,
      searchTerm,
      verificationFilter,
    ],
    enabled: Boolean(token),
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      if (verificationFilter.trim()) {
        params.set("verification_status", verificationFilter.trim());
      }

      return apiRequest<FarmsListResponse>(
        `/web/farms/?${params.toString()}`,
        {
          method: "GET",
          token,
        }
      );
    },
  });

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list"],
    enabled: Boolean(token),
    queryFn: async () => {
      return apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", {
        method: "GET",
        token,
      });
    },
  });
console.log("list===>", farmersQuery.data);
  const deleteFarmMutation = useMutation({
    mutationFn: async (farmId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/farms/${farmId}/`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["farms"],
      });
    },
  });

  const verifyFarmMutation = useMutation({
    mutationFn: async (payload: { farmId: string; status: "VERIFIED" | "REJECTED" }) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<FarmResponse>(`/web/farms/${payload.farmId}/verify`, {
        method: "PATCH",
        token,
        body: { verification_status: payload.status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["farms"],
      });
    },
  });

  const farms = farmsQuery.data?.items ?? [];
  const total = farmsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const farmers = farmersQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  const isLoading = farmsQuery.isLoading || farmersQuery.isLoading;
  const isError = farmsQuery.isError || farmersQuery.isError;

  const handleDelete = (farmId: string, farmerName: string) => {
    const confirmed = window.confirm(
      `Delete farm for "${farmerName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteFarmMutation.mutate(farmId);
  };

  const handleVerify = (farmId: string, status: "VERIFIED" | "REJECTED") => {
    const action = status === "VERIFIED" ? "verify" : "reject";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this farm?`
    );

    if (!confirmed) return;

    verifyFarmMutation.mutate({ farmId, status });
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Farm Management
          </h1>

          <p className="text-muted-foreground">
            Manage and verify farmer farms.
          </p>
        </div>

        <Link
          to="/dashboard/farms/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Farm
        </Link>
      </div>

      {/* CARD */}
      <div className="bg-card border border-border rounded-lg shadow-sm">
        {/* FILTERS */}
        <div className="p-6 border-b border-border">
          <div className="flex flex-col md:flex-row gap-4">
            {/* SEARCH */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />

              <input
                type="text"
                placeholder="Search by farmer name or GPS coordinates..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* VERIFICATION STATUS */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={verificationFilter}
                onChange={(e) => {
                  setPage(1);
                  setVerificationFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load farms.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Farmer
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  GPS Location
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Size (ha)
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Primary Crop
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 5 }).map(
                    (_, row) => (
                      <tr key={row}>
                        {Array.from({
                          length: 6,
                        }).map((__, cell) => (
                          <td
                            key={cell}
                            className="px-6 py-4"
                          >
                            <Skeleton className="h-4 w-24" />
                          </td>
                        ))}
                      </tr>
                    )
                  )
                : farms.map((farm) => {
                    const farmer = farmerById.get(farm.farmer_id);

                    return (
                      <tr
                        key={farm.farm_id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground font-medium">
                              {farmer?.full_name || "Unknown Farmer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {farmer?.nrc_number || farm.farmer_id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {farm.gps_latitude}, {farm.gps_longitude}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {farm.size_hectares || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {farm.primary_crop || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              farm.verification_status
                                ? verificationStatusColors[farm.verification_status]
                                : "bg-muted/10 text-muted-foreground"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {farm.verification_status || "UNKNOWN"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {farm.verification_status === "PENDING" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerify(farm.farm_id, "VERIFIED")
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary/10 text-secondary rounded hover:bg-secondary/20"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleVerify(farm.farm_id, "REJECTED")
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            <Link
                              to={`/dashboard/farms/${farm.farm_id}/edit`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  farm.farm_id,
                                  farmer?.full_name || "Unknown"
                                )
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {!isLoading &&
            farms.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No farms found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {farms.length} of {total} farms
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() =>
                setPage((prev) =>
                  Math.max(prev - 1, 1)
                )
              }
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="px-3 py-2 text-sm">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    prev + 1,
                    totalPages
                  )
                )
              }
              className="px-3 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
