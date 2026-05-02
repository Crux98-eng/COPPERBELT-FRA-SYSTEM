import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Plus, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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

interface SeasonsListResponse {
  items: SeasonResponse[];
  total: number;
  skip: number;
  limit: number;
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

export function SeasonManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const seasonsQuery = useQuery({
    queryKey: ["seasons", "list", page, searchTerm],
    enabled: Boolean(token),
    queryFn: async () => {
      const params = new URLSearchParams({
        skip: String(skip),
        limit: String(limit),
      });

      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      }

      return apiRequest<SeasonsListResponse>(
        `/web/seasons?${params.toString()}`,
        { token }
      );
    },
  });

  const deleteSeasonMutation = useMutation({
    mutationFn: async (seasonId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/seasons/${seasonId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["seasons"],
      });
    },
  });

  const seasons = seasonsQuery.data?.items ?? [];
  const total = seasonsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const isLoading = seasonsQuery.isLoading;
  const isError = seasonsQuery.isError;

  const handleDelete = (seasonId: string, seasonName: string) => {
    const confirmed = window.confirm(
      `Delete season "${seasonName}"? This action cannot be undone and may affect existing data.`
    );

    if (!confirmed) return;

    deleteSeasonMutation.mutate(seasonId);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "N/A";
    return `ZMW ${parseFloat(amount).toFixed(2)}`;
  };

  const isActiveSeason = (season: SeasonResponse) => {
    if (!season.redemption_window_start || !season.redemption_window_end) {
      return false;
    }
    const now = new Date();
    const startDate = new Date(season.redemption_window_start);
    const endDate = new Date(season.redemption_window_end);
    return now >= startDate && now <= endDate;
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Season Management
          </h1>

          <p className="text-muted-foreground">
            Manage agricultural seasons and pricing parameters.
          </p>
        </div>

        <Link
          to="/dashboard/seasons/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Season
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
                placeholder="Search by season name..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load seasons.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Season Name
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Market Price
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Farmer Contribution
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Redemption Window
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
                : seasons.map((season) => (
                    <tr
                      key={season.season_id}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground font-medium">
                            {season.season_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {season.season_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatCurrency(season.market_price_per_kg)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {formatCurrency(season.farmer_contribution)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {formatDate(season.redemption_window_start)} - {formatDate(season.redemption_window_end)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                            isActiveSeason(season)
                              ? "bg-secondary/10 text-secondary"
                              : "bg-muted/10 text-muted-foreground"
                          }`}
                        >
                          {isActiveSeason(season) ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            to={`/dashboard/seasons/${season.season_id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(season.season_id, season.season_name)
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
            seasons.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No seasons found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {seasons.length} of {total} seasons
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
