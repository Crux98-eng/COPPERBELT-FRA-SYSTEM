import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Plus, Edit, Trash2, DollarSign, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

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
  farmer?: {
    farmer_id: string;
    full_name: string;
    nrc_number: string;
    district?: string | null;
  };
  batch?: {
    batch_id: string;
    qr_code: string;
    initial_weight_kg?: string | null;
    quality_grade?: "A" | "B" | "C" | null;
  };
}

interface FarmerResponse {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  district?: string | null;
}

interface BatchResponse {
  batch_id: string;
  qr_code: string;
  initial_weight_kg?: string | null;
  quality_grade?: "A" | "B" | "C" | null;
}

interface PaymentsListResponse {
  items: PaymentResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface PaymentCreate {
  farmer_id: string;
  batch_id: string;
  market_price_used?: number;
}

const paymentStatusColors = {
  CREATED: "bg-muted/10 text-muted-foreground",
  APPROVED: "bg-secondary/10 text-secondary",
  SENT: "bg-primary/10 text-primary",
  CONFIRMED: "bg-secondary/10 text-secondary",
  FAILED: "bg-destructive/10 text-destructive",
  MANUAL_REVIEW: "bg-accent/10 text-accent",
};

export function PaymentManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const paymentsQuery = useQuery({
    queryKey: [
      "payments",
      "list",
      page,
      searchTerm,
      statusFilter,
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

      if (statusFilter.trim()) {
        params.set("payment_status", statusFilter.trim());
      }

      return apiRequest<PaymentsListResponse>(
        `/web/payments?${params.toString()}`,
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

  const batchesQuery = useQuery({
    queryKey: ["batches", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<BatchResponse[]>("/web/batches/?limit=200", { token }),
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/payments/${paymentId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
    },
  });

  const approvePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) =>
      apiRequest<PaymentResponse>(`/web/payments/${paymentId}/approve`, {
        method: "PATCH",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
    },
  });

  const rejectPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) =>
      apiRequest<PaymentResponse>(`/web/payments/${paymentId}/reject`, {
        method: "PATCH",
        token,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["payments"],
      });
    },
  });

  const payments = paymentsQuery.data?.items ?? [];
  const total = paymentsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const farmers = farmersQuery.data ?? [];
  const batches = batchesQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  const batchById = useMemo(() => {
    return new Map(batches.map((batch) => [batch.batch_id, batch]));
  }, [batches]);

  const isLoading = paymentsQuery.isLoading || farmersQuery.isLoading || batchesQuery.isLoading;
  const isError = paymentsQuery.isError || farmersQuery.isError || batchesQuery.isError;

  const handleDelete = (paymentId: string, farmerName: string) => {
    const confirmed = window.confirm(
      `Delete payment for "${farmerName}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deletePaymentMutation.mutate(paymentId);
  };

  const handleApprove = (paymentId: string, farmerName: string) => {
    const confirmed = window.confirm(
      `Approve payment for "${farmerName}"?`
    );

    if (!confirmed) return;

    approvePaymentMutation.mutate(paymentId);
  };

  const handleReject = (paymentId: string, farmerName: string) => {
    const confirmed = window.confirm(
      `Reject payment for "${farmerName}"?`
    );

    if (!confirmed) return;

    rejectPaymentMutation.mutate(paymentId);
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return "N/A";
    return `ZMW ${parseFloat(amount).toFixed(2)}`;
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
            Payment Management
          </h1>

          <p className="text-muted-foreground">
            Manage farmer payments and approval workflows.
          </p>
        </div>

        <Link
          to="/dashboard/payments/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Payment
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
                placeholder="Search by farmer name, batch, or amount..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Statuses</option>
                <option value="CREATED">Created</option>
                <option value="APPROVED">Approved</option>
                <option value="SENT">Sent</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
                <option value="MANUAL_REVIEW">Manual Review</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load payments.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Payment ID
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Farmer
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Batch
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Status
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
                : payments.map((payment) => {
                    const farmer = farmerById.get(payment.farmer_id);
                    const batch = batchById.get(payment.batch_id);

                    return (
                      <tr
                        key={payment.payment_id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground font-medium">
                              {payment.payment_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {payment.payment_id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground">
                              {farmer?.full_name || "Unknown Farmer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {farmer?.nrc_number || payment.farmer_id}
                            </p>
                            {farmer?.district && (
                              <p className="text-xs text-muted-foreground">
                                {farmer.district}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground">
                              {batch?.qr_code || "Unknown Batch"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {batch?.initial_weight_kg ? `${batch.initial_weight_kg} kg` : "N/A"}
                              {batch?.quality_grade && ` • Grade ${batch.quality_grade}`}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatCurrency(payment.amount_zmw)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          {payment.payment_status ? (
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                paymentStatusColors[payment.payment_status]
                              }`}
                            >
                              {payment.payment_status === "CREATED" && <Clock className="w-4 h-4" />}
                              {payment.payment_status === "APPROVED" && <CheckCircle className="w-4 h-4" />}
                              {payment.payment_status === "CONFIRMED" && <CheckCircle className="w-4 h-4" />}
                              {payment.payment_status === "FAILED" && <AlertTriangle className="w-4 h-4" />}
                              {payment.payment_status === "MANUAL_REVIEW" && <AlertTriangle className="w-4 h-4" />}
                              {payment.payment_status}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {formatDate(payment.created_at)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {payment.payment_status === "CREATED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApprove(
                                      payment.payment_id,
                                      farmer?.full_name || "Unknown"
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
                                    handleReject(
                                      payment.payment_id,
                                      farmer?.full_name || "Unknown"
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
                              to={`/dashboard/payments/${payment.payment_id}/edit`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  payment.payment_id,
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
            payments.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No payments found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {payments.length} of {total} payments
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
