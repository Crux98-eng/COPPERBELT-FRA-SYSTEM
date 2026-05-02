import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Scale,
  Package,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

type BatchState = "HARVESTED" | "COLLECTED" | "IN_TRANSIT" | "STORED";

interface BatchResponse {
  batch_id: string;
  farmer_id: string;
  season_id: string;
  qr_code: string;
  initial_weight_kg?: string | null;
  quality_grade?: "A" | "B" | "C" | null;
  current_state?: BatchState | null;
  collecting_agent_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface FarmerResponse {
  farmer_id: string;
  nrc_number: string;
  phone_number: string;
  full_name: string;
  district?: string | null;
}

interface PaymentResponse {
  payment_id: string;
  farmer_id: string;
  batch_id: string;
  amount_zmw?: string | null;
  payment_status?: string | null;
  market_price_used?: string | null;
  created_at: string;
  updated_at: string;
}

export function ShedProcurement() {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [actualWeight, setActualWeight] = useState("");
  const [marketPrice, setMarketPrice] = useState("8");
  const [review, setReview] = useState<{
    batch: BatchResponse;
    farmer?: FarmerResponse;
    expectedWeight: number;
    actualWeight: number;
    variance: number;
    pricePerKg: number;
    estimatedAmount: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const batchesQuery = useQuery({
    queryKey: ["batches", "shed-ready"],
    queryFn: () =>
      apiRequest<BatchResponse[]>(
        "/web/batches/?limit=200&current_state=IN_TRANSIT",
        { token },
      ),
  });

  const farmersQuery = useQuery({
    queryKey: ["farmers", "list", "shed"],
    queryFn: () =>
      apiRequest<FarmerResponse[]>("/web/farmers/?limit=200", { token }),
  });

  const readyBatches = batchesQuery.data ?? [];
  const farmers = farmersQuery.data ?? [];

  const farmerById = useMemo(() => {
    return new Map(farmers.map((farmer) => [farmer.farmer_id, farmer]));
  }, [farmers]);

  const selectedBatch =
    readyBatches.find((batch) => batch.batch_id === selectedBatchId) ??
    readyBatches[0] ??
    null;

  const selectedFarmer = selectedBatch
    ? farmerById.get(selectedBatch.farmer_id)
    : undefined;

  useEffect(() => {
    if (!selectedBatchId && readyBatches.length > 0) {
      setSelectedBatchId(readyBatches[0].batch_id);
    }
  }, [readyBatches, selectedBatchId]);

  const storeBatchMutation = useMutation({
    mutationFn: (batchId: string) =>
      apiRequest<BatchResponse>(`/web/batches/${batchId}/state`, {
        method: "PATCH",
        token,
        body: { current_state: "STORED" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (payload: {
      farmer_id: string;
      batch_id: string;
      market_price_used?: number;
    }) =>
      apiRequest<PaymentResponse>("/web/payments/", {
        method: "POST",
        token,
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  const expectedWeight = selectedBatch?.initial_weight_kg
    ? Number(selectedBatch.initial_weight_kg)
    : 0;

  const calculateVariance = (actual: number, expected: number) => {
    if (!expected) return 0;
    return ((actual - expected) / expected) * 100;
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) > 5) return "text-destructive";
    if (Math.abs(variance) <= 2) return "text-secondary";
    return "text-accent";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="w-4 h-4 inline-block ml-1" />;
    if (variance < 0)
      return <TrendingDown className="w-4 h-4 inline-block ml-1" />;
    return <CheckCircle className="w-4 h-4 inline-block ml-1" />;
  };

  const handleProcurementReview = () => {
    setError("");
    setSuccessMessage("");

    if (!selectedBatch) {
      setError("Select a batch before creating a procurement review.");
      return;
    }

    const normalizedActualWeight = Number(actualWeight);
    const normalizedMarketPrice = Number(marketPrice);

    if (!normalizedActualWeight || normalizedActualWeight <= 0) {
      setError("Enter a valid received weight.");
      return;
    }

    if (!normalizedMarketPrice || normalizedMarketPrice <= 0) {
      setError("Enter a valid market price.");
      return;
    }

    const variance = calculateVariance(normalizedActualWeight, expectedWeight);

    setReview({
      batch: selectedBatch,
      farmer: selectedFarmer,
      expectedWeight,
      actualWeight: normalizedActualWeight,
      variance,
      pricePerKg: normalizedMarketPrice,
      estimatedAmount: normalizedActualWeight * normalizedMarketPrice,
    });
  };

  const handleFinalSubmit = async () => {
    if (!review) return;

    setError("");
    setSuccessMessage("");

    try {
      await storeBatchMutation.mutateAsync(review.batch.batch_id);
      const payment = await createPaymentMutation.mutateAsync({
        farmer_id: review.batch.farmer_id,
        batch_id: review.batch.batch_id,
        market_price_used: review.pricePerKg,
      });

      setSuccessMessage(
        `Batch stored and payment ${payment.payment_id} created successfully.`,
      );
      setReview(null);
      setActualWeight("");
      setSelectedBatchId(null);
    } catch (submitError) {
      console.error("Failed to submit procurement:", submitError);
      setError("Could not submit procurement. Check the batch and try again.");
    }
  };

  const isLoading = batchesQuery.isLoading || farmersQuery.isLoading;
  const isSubmitting =
    storeBatchMutation.isPending || createPaymentMutation.isPending;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Shed Procurement</h1>
        <p className="text-muted-foreground">
          Store received batches and create payment records from the web API.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Ready Batches</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Current state: IN_TRANSIT
              </p>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="p-4">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))
              ) : readyBatches.length > 0 ? (
                readyBatches.map((batch) => {
                  const farmer = farmerById.get(batch.farmer_id);
                  const isSelected = selectedBatch?.batch_id === batch.batch_id;

                  return (
                    <button
                      key={batch.batch_id}
                      type="button"
                      onClick={() => {
                        setSelectedBatchId(batch.batch_id);
                        setReview(null);
                        setError("");
                        setSuccessMessage("");
                      }}
                      className={`w-full text-left p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/5 border-l-4 border-l-primary"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-card-foreground mb-1">
                            {batch.qr_code || batch.batch_id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {farmer?.full_name || batch.farmer_id}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">
                          {batch.current_state || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>{batch.initial_weight_kg || "0"} kg</span>
                        <span>Grade {batch.quality_grade || "N/A"}</span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No batches ready for shed procurement
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl text-card-foreground mb-1">
                {selectedBatch?.qr_code || selectedBatch?.batch_id || "No batch selected"}
              </h2>
              <p className="text-muted-foreground">
                {selectedFarmer?.full_name || "Select a ready batch to continue"}
              </p>
            </div>

            <div className="p-6">
              {selectedBatch ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-5 h-5 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Expected Weight
                        </p>
                      </div>
                      <p className="text-2xl text-card-foreground">
                        {expectedWeight.toFixed(1)} kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From batch initial weight
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-5 h-5 text-secondary" />
                        <p className="text-sm text-muted-foreground">Grade</p>
                      </div>
                      <p className="text-2xl text-card-foreground">
                        {selectedBatch.quality_grade || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        QR: {selectedBatch.qr_code}
                      </p>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-accent" />
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                      <p className="text-2xl text-card-foreground">
                        {selectedBatch.current_state}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Will update to STORED
                      </p>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-6 bg-muted/10">
                    <h3 className="text-lg text-card-foreground mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-secondary" />
                      Procurement Review
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm text-card-foreground mb-2">
                          Received Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="0.0"
                          value={actualWeight}
                          onChange={(event) => {
                            setReview(null);
                            setActualWeight(event.target.value);
                          }}
                          className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-card-foreground mb-2">
                          Market Price (ZMW/kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={marketPrice}
                          onChange={(event) => {
                            setReview(null);
                            setMarketPrice(event.target.value);
                          }}
                          className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {error && (
                      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mt-4">
                        {error}
                      </p>
                    )}

                    {successMessage && (
                      <p className="rounded-md border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary mt-4">
                        {successMessage}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleProcurementReview}
                      className="w-full mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create Procurement Review
                    </button>
                  </div>

                  {review && (
                    <div className="bg-card border border-border rounded-lg shadow-sm mt-6">
                      <div className="p-6 border-b border-border">
                        <h3 className="text-xl text-card-foreground mb-1">
                          Purchase Review
                        </h3>
                        <p className="text-muted-foreground">
                          Farmer: {review.farmer?.full_name || review.batch.farmer_id}
                        </p>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Received Weight
                            </p>
                            <p className="text-2xl text-card-foreground">
                              {review.actualWeight.toFixed(1)} kg
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Variance
                            </p>
                            <p
                              className={`text-2xl ${getVarianceColor(
                                review.variance,
                              )}`}
                            >
                              {review.variance.toFixed(1)}%
                              {getVarianceIcon(review.variance)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Market Price
                            </p>
                            <p className="text-2xl text-card-foreground">
                              ZMW {review.pricePerKg.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              Estimated Amount
                            </p>
                            <p className="text-2xl text-card-foreground">
                              ZMW {review.estimatedAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleFinalSubmit}
                          disabled={isSubmitting}
                          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting
                            ? "Submitting..."
                            : "Store Batch and Create Payment"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No ready batch selected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
