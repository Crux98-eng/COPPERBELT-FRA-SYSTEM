import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Plus, Edit, Trash2, Package, Truck, AlertTriangle } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

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
  farmer?: {
    farmer_id: string;
    full_name: string;
    nrc_number: string;
    district?: string | null;
  };
  season?: {
    season_id: string;
    season_name: string;
  };
}

interface FarmerResponse {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  district?: string | null;
}

interface SeasonResponse {
  season_id: string;
  season_name: string;
}

interface BatchesListResponse {
  items: BatchResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface BatchCreate {
  farmer_id: string;
  season_id: string;
  qr_code?: string;
  initial_weight_kg?: number;
  quality_grade?: "A" | "B" | "C";
}

const batchStateColors = {
  HARVESTED: "bg-muted/10 text-muted-foreground",
  COLLECTED: "bg-accent/10 text-accent",
  IN_TRANSIT: "bg-primary/10 text-primary",
  STORED: "bg-secondary/10 text-secondary",
};

const qualityGradeColors = {
  A: "bg-secondary/10 text-secondary",
  B: "bg-accent/10 text-accent",
  C: "bg-destructive/10 text-destructive",
};

export function BatchManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const batchesQuery = useQuery({
    queryKey: [
      "batches",
      "list",
      page,
      searchTerm,
      seasonFilter,
      stateFilter,
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

      if (seasonFilter.trim()) {
        params.set("season_id", seasonFilter.trim());
      }

      if (stateFilter.trim()) {
        params.set("current_state", stateFilter.trim());
      }

      return apiRequest<BatchesListResponse>(
        `/web/batches?${params.toString()}`,
        { token }
      );
    },
  });

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

  const deleteBatchMutation = useMutation({
    mutationFn: async (batchId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/batches/${batchId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });

  const updateBatchStateMutation = useMutation({
    mutationFn: (payload: { batchId: string; state: "HARVESTED" | "COLLECTED" | "IN_TRANSIT" | "STORED" }) =>
      apiRequest<BatchResponse>(`/web/batches/${payload.batchId}/state`, {
        method: "PATCH",
        token,
        body: { current_state: payload.state },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["batches"],
      });
    },
  });

  const batches = batchesQuery.data?.items ?? [];
  const total = batchesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const farmers = farmersQuery.data ?? [];
  const seasons = seasonsQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  const seasonById = useMemo(() => {
    return new Map(seasons.map((season) => [season.season_id, season]));
  }, [seasons]);

  const isLoading = batchesQuery.isLoading || farmersQuery.isLoading || seasonsQuery.isLoading;
  const isError = batchesQuery.isError || farmersQuery.isError || seasonsQuery.isError;

  const handleDelete = (batchId: string, qrCode: string) => {
    const confirmed = window.confirm(
      `Delete batch "${qrCode}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteBatchMutation.mutate(batchId);
  };

  const handleStateUpdate = (batchId: string, currentState: string, qrCode: string, newState: "HARVESTED" | "COLLECTED" | "IN_TRANSIT" | "STORED") => {
    const confirmed = window.confirm(
      `Update batch "${qrCode}" from ${currentState} to ${newState}?`
    );

    if (!confirmed) return;

    updateBatchStateMutation.mutate({ batchId, state: newState });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Batch Management
          </h1>

          <p className="text-muted-foreground">
            Manage agricultural product batches and track their lifecycle.
          </p>
        </div>

        <Link
          to="/dashboard/batches/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Batch
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
                placeholder="Search by QR code, farmer name, or NRC..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* SEASON FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={seasonFilter}
                onChange={(e) => {
                  setPage(1);
                  setSeasonFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Seasons</option>
                {seasons.map((season) => (
                  <option key={season.season_id} value={season.season_id}>
                    {season.season_name}
                  </option>
                ))}
              </select>
            </div>

            {/* STATE FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={stateFilter}
                onChange={(e) => {
                  setPage(1);
                  setStateFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All States</option>
                <option value="HARVESTED">Harvested</option>
                <option value="COLLECTED">Collected</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="STORED">Stored</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load batches.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Batch Info
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Farmer
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Season
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Weight
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Grade
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  State
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
                          length: 8,
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
                : batches.map((batch) => (
                    <tr
                      key={batch.batch_id}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground font-medium">
                            {batch.qr_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {batch.batch_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground">
                            {batch.farmer?.full_name || "Unknown Farmer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {batch.farmer?.nrc_number || batch.farmer_id}
                          </p>
                          {batch.farmer?.district && (
                            <p className="text-xs text-muted-foreground">
                              {batch.farmer.district}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground">
                            {batch.season?.season_name || "Unknown Season"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {batch.season_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {batch.initial_weight_kg ? `${batch.initial_weight_kg} kg` : "N/A"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {batch.quality_grade ? (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              qualityGradeColors[batch.quality_grade]
                            }`}
                          >
                            {batch.quality_grade}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {batch.current_state ? (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              batchStateColors[batch.current_state]
                            }`}
                          >
                            {batch.current_state === "IN_TRANSIT" && <Truck className="w-4 h-4" />}
                            {batch.current_state === "STORED" && <Package className="w-4 h-4" />}
                            {batch.current_state === "COLLECTED" && <Package className="w-4 h-4" />}
                            {batch.current_state === "HARVESTED" && <Package className="w-4 h-4" />}
                            {batch.current_state}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {/* STATE UPDATE ACTIONS */}
                          {batch.current_state && batch.current_state !== "STORED" && (
                            <div className="relative group">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                              >
                                Update State
                              </button>
                              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible z-10 min-w-32">
                                {["COLLECTED", "IN_TRANSIT", "STORED"].map((state) => (
                                  <button
                                    key={state}
                                    type="button"
                                    onClick={() => handleStateUpdate(
                                      batch.batch_id,
                                      batch.current_state!,
                                      batch.qr_code,
                                      state as any
                                    )}
                                    className="block w-full text-left px-3 py-2 text-sm hover:bg-muted/20"
                                  >
                                    {state.replace("_", " ")}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <Link
                            to={`/dashboard/batches/${batch.batch_id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent/10 text-accent rounded hover:bg-accent/20"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(batch.batch_id, batch.qr_code)
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading &&
            batches.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No batches found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {batches.length} of {total} batches
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
