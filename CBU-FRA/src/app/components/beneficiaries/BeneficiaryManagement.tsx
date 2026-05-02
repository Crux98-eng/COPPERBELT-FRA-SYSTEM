import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Plus, Edit, Trash2, CheckCircle, AlertTriangle, QrCode } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface BeneficiaryResponse {
  status_id: string;
  farmer_id: string;
  season_id: string;
  eligibility_state: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
  tagged_by?: string | null;
  approved_by?: string | null;
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
  codes?: RedeemingCodeResponse[];
}

interface RedeemingCodeResponse {
  code_id: string;
  status_id: string;
  code_value: string;
  generated_at: string;
  expires_at?: string | null;
  code_status?: "ACTIVE" | "REDEEMED" | "EXPIRED" | null;
  input_type?: "FERT" | "SEED" | null;
  created_at: string;
  updated_at: string;
}

interface SeasonResponse {
  season_id: string;
  season_name: string;
}

interface BeneficiariesListResponse {
  items: BeneficiaryResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface BeneficiaryCreate {
  farmer_id: string;
  season_id: string;
  eligibility_state?: "ELIGIBLE" | "INELIGIBLE" | "PENDING";
}

interface GenerateCodesRequest {
  input_types: ("FERT" | "SEED")[];
  expires_at?: string;
}

const eligibilityColors = {
  ELIGIBLE: "bg-secondary/10 text-secondary",
  INELIGIBLE: "bg-destructive/10 text-destructive",
  PENDING: "bg-accent/10 text-accent",
};

const codeStatusColors = {
  ACTIVE: "bg-secondary/10 text-secondary",
  REDEEMED: "bg-muted/10 text-muted-foreground",
  EXPIRED: "bg-destructive/10 text-destructive",
};

export function BeneficiaryManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [seasonFilter, setSeasonFilter] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const beneficiariesQuery = useQuery({
    queryKey: [
      "beneficiaries",
      "list",
      page,
      searchTerm,
      seasonFilter,
      eligibilityFilter,
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

      if (eligibilityFilter.trim()) {
        params.set("eligibility_state", eligibilityFilter.trim());
      }

      return apiRequest<BeneficiariesListResponse>(
        `/web/beneficiaries?${params.toString()}`,
        { token }
      );
    },
  });

  const seasonsQuery = useQuery({
    queryKey: ["seasons", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<SeasonResponse[]>("/web/seasons/?limit=200", { token }),
  });

  const deleteBeneficiaryMutation = useMutation({
    mutationFn: async (statusId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/beneficiaries/${statusId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["beneficiaries"],
      });
    },
  });

  const updateEligibilityMutation = useMutation({
    mutationFn: (payload: { statusId: string; eligibilityState: "ELIGIBLE" | "INELIGIBLE" | "PENDING" }) =>
      apiRequest<BeneficiaryResponse>(`/web/beneficiaries/${payload.statusId}`, {
        method: "PATCH",
        token,
        body: { eligibility_state: payload.eligibilityState },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["beneficiaries"],
      });
    },
  });

  const generateCodesMutation = useMutation({
    mutationFn: (payload: { statusId: string; inputTypes: ("FERT" | "SEED")[]; expiresAt?: string }) =>
      apiRequest<RedeemingCodeResponse[]>(`/web/beneficiaries/${payload.statusId}/generate-codes`, {
        method: "POST",
        token,
        body: {
          input_types: payload.inputTypes,
          expires_at: payload.expiresAt,
        } as GenerateCodesRequest,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["beneficiaries"],
      });
    },
  });

  const beneficiaries = beneficiariesQuery.data?.items ?? [];
  const total = beneficiariesQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const seasons = seasonsQuery.data ?? [];

  const isLoading = beneficiariesQuery.isLoading || seasonsQuery.isLoading;
  const isError = beneficiariesQuery.isError || seasonsQuery.isError;

  const handleDelete = (statusId: string, farmerName: string) => {
    const confirmed = window.confirm(
      `Delete beneficiary status for "${farmerName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteBeneficiaryMutation.mutate(statusId);
  };

  const handleUpdateEligibility = (statusId: string, currentState: string, farmerName: string, newState: "ELIGIBLE" | "INELIGIBLE" | "PENDING") => {
    const action = newState === "ELIGIBLE" ? "approve" : newState === "INELIGIBLE" ? "reject" : "set to pending";
    const confirmed = window.confirm(
      `Are you sure you want to ${action} beneficiary status for "${farmerName}"?`
    );

    if (!confirmed) return;

    updateEligibilityMutation.mutate({ statusId, eligibilityState: newState });
  };

  const handleGenerateCodes = (statusId: string, farmerName: string) => {
    const inputTypes = prompt(
      "Enter input types (comma-separated): FERT, SEED",
      "FERT,SEED"
    );

    if (!inputTypes) return;

    const types = inputTypes.split(",").map(t => t.trim().toUpperCase() as "FERT" | "SEED").filter(t => ["FERT", "SEED"].includes(t));
    
    if (types.length === 0) {
      alert("Please enter valid input types (FERT, SEED)");
      return;
    }

    const expiresAt = prompt("Enter expiry date (YYYY-MM-DD) or leave empty for no expiry:");
    
    generateCodesMutation.mutate({
      statusId,
      inputTypes: types,
      expiresAt: expiresAt || undefined,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 bg-[green]/20 h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 ">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Beneficiary Management
          </h1>

          <p className="text-muted-foreground">
            Manage farmer eligibility and generate redemption codes.
          </p>
        </div>

        <Link
          to="/dashboard/beneficiaries/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Beneficiary
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
                placeholder="Search by farmer name or NRC..."
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

            {/* ELIGIBILITY FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={eligibilityFilter}
                onChange={(e) => {
                  setPage(1);
                  setEligibilityFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="ELIGIBLE">Eligible</option>
                <option value="INELIGIBLE">Ineligible</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load beneficiaries.
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
                  Season
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Eligibility
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Codes
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Created
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
                : beneficiaries.map((beneficiary) => (
                    <tr
                      key={beneficiary.status_id}
                      className="hover:bg-muted/20"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground font-medium">
                            {beneficiary.farmer?.full_name || "Unknown Farmer"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {beneficiary.farmer?.nrc_number || beneficiary.farmer_id}
                          </p>
                          {beneficiary.farmer?.district && (
                            <p className="text-xs text-muted-foreground">
                              {beneficiary.farmer.district}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-card-foreground">
                            {beneficiary.season?.season_name || "Unknown Season"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {beneficiary.season_id}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            eligibilityColors[beneficiary.eligibility_state]
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {beneficiary.eligibility_state}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {beneficiary.codes?.length || 0} codes
                          </span>
                          {beneficiary.eligibility_state === "ELIGIBLE" && (
                            <button
                              type="button"
                              onClick={() => handleGenerateCodes(
                                beneficiary.status_id,
                                beneficiary.farmer?.full_name || "Unknown"
                              )}
                              className="p-1 text-primary hover:bg-primary/10 rounded"
                              title="Generate codes"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm">
                          {formatDate(beneficiary.created_at)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {beneficiary.eligibility_state === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateEligibility(
                                    beneficiary.status_id,
                                    beneficiary.eligibility_state,
                                    beneficiary.farmer?.full_name || "Unknown",
                                    "ELIGIBLE"
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-secondary/10 text-secondary rounded hover:bg-secondary/20"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateEligibility(
                                    beneficiary.status_id,
                                    beneficiary.eligibility_state,
                                    beneficiary.farmer?.full_name || "Unknown",
                                    "INELIGIBLE"
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                              >
                                <AlertTriangle className="w-3 h-3" />
                                Reject
                              </button>
                            </>
                          )}

                          <Link
                            to={`/dashboard/beneficiaries/${beneficiary.status_id}/edit`}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                beneficiary.status_id,
                                beneficiary.farmer?.full_name || "Unknown"
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
                  ))}
            </tbody>
          </table>

          {!isLoading &&
            beneficiaries.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No beneficiaries found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {beneficiaries.length} of {total} beneficiaries
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
