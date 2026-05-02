import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Search, Filter, Plus, Edit, Trash2, DollarSign, CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuth } from "@/app/auth/AuthContext";
import { ApiError, apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface TransactionResponse {
  transaction_id: string;
  payment_id: string;
  transaction_type: "CREDIT" | "DEBIT";
  amount_zmw: string;
  description?: string | null;
  reference_number?: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  payment?: {
    payment_id: string;
    farmer_id: string;
    amount_zmw?: string | null;
    payment_status?: string | null;
    farmer?: {
      farmer_id: string;
      full_name: string;
      nrc_number: string;
      district?: string | null;
    };
  };
}

interface FarmerResponse {
  farmer_id: string;
  full_name: string;
  nrc_number: string;
  district?: string | null;
}

interface PaymentResponse {
  payment_id: string;
  farmer_id: string;
  amount_zmw?: string | null;
  payment_status?: string | null;
  farmer?: {
    farmer_id: string;
    full_name: string;
    nrc_number: string;
    district?: string | null;
  };
}

interface TransactionsListResponse {
  items: TransactionResponse[];
  total: number;
  skip: number;
  limit: number;
}

interface TransactionCreate {
  payment_id: string;
  transaction_type: "CREDIT" | "DEBIT";
  amount_zmw: number;
  description?: string;
  reference_number?: string;
}

const transactionTypeColors = {
  CREDIT: "bg-secondary/10 text-secondary",
  DEBIT: "bg-destructive/10 text-destructive",
};

export function TransactionManagement() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const limit = 50;
  const skip = (page - 1) * limit;

  const transactionsQuery = useQuery({
    queryKey: [
      "transactions",
      "list",
      page,
      searchTerm,
      typeFilter,
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

      if (typeFilter.trim()) {
        params.set("transaction_type", typeFilter.trim());
      }

      return apiRequest<TransactionsListResponse>(
        `/web/transactions?${params.toString()}`,
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

  const paymentsQuery = useQuery({
    queryKey: ["payments", "list"],
    enabled: Boolean(token),
    queryFn: () =>
      apiRequest<PaymentResponse[]>("/web/payments/?limit=200", { token }),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      if (!token) {
        throw new ApiError(
          "Admin token missing. Please login again.",
          401,
          null
        );
      }

      return apiRequest<void>(`/web/transactions/${transactionId}`, {
        method: "DELETE",
        token,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      });
    },
  });

  const transactions = transactionsQuery.data?.items ?? [];
  const total = transactionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const farmers = farmersQuery.data ?? [];
  const payments = paymentsQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  const paymentById = useMemo(() => {
    return new Map(payments.map((payment) => [payment.payment_id, payment]));
  }, [payments]);

  const isLoading = transactionsQuery.isLoading || farmersQuery.isLoading || paymentsQuery.isLoading;
  const isError = transactionsQuery.isError || farmersQuery.isError || paymentsQuery.isError;

  const handleDelete = (transactionId: string, referenceNumber: string) => {
    const confirmed = window.confirm(
      `Delete transaction "${referenceNumber}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    deleteTransactionMutation.mutate(transactionId);
  };

  const formatCurrency = (amount: string) => {
    return `ZMW ${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl text-foreground mb-2">
            Transaction Management
          </h1>

          <p className="text-muted-foreground">
            Manage financial transactions and payment records.
          </p>
        </div>

        <Link
          to="/dashboard/transactions/create"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
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
                placeholder="Search by reference, description, or farmer..."
                value={searchTerm}
                onChange={(e) => {
                  setPage(1);
                  setSearchTerm(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* TYPE FILTER */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />

              <select
                value={typeFilter}
                onChange={(e) => {
                  setPage(1);
                  setTypeFilter(e.target.value);
                }}
                className="px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Types</option>
                <option value="CREDIT">Credit</option>
                <option value="DEBIT">Debit</option>
              </select>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {isError && (
          <div className="p-6 text-destructive">
            Failed to load transactions.
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm">
                  Transaction ID
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Reference
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Farmer
                </th>
                <th className="px-6 py-4 text-left text-sm">
                  Date
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
                          length: 9,
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
                : transactions.map((transaction) => {
                    const farmer = transaction.payment?.farmer;
                    const payment = paymentById.get(transaction.payment_id);

                    return (
                      <tr
                        key={transaction.transaction_id}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground font-medium">
                              {transaction.transaction_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ID: {transaction.transaction_id}
                            </p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm text-card-foreground">
                            {transaction.reference_number || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                              transactionTypeColors[transaction.transaction_type]
                            }`}
                          >
                            {transaction.transaction_type === "CREDIT" ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                            {transaction.transaction_type}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatCurrency(transaction.amount_zmw)}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {transaction.description || "N/A"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-card-foreground">
                              {farmer?.full_name || "Unknown Farmer"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {farmer?.nrc_number || "N/A"}
                            </p>
                            {farmer?.district && (
                              <p className="text-xs text-muted-foreground">
                                {farmer.district}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm">
                            {formatDate(transaction.transaction_date)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              to={`/dashboard/transactions/${transaction.transaction_id}/edit`}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary rounded hover:bg-primary/20"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  transaction.transaction_id,
                                  transaction.reference_number || transaction.transaction_id
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
            transactions.length === 0 && (
              <div className="p-10 text-center text-muted-foreground">
                No transactions found.
              </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {transactions.length} of {total} transactions
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
