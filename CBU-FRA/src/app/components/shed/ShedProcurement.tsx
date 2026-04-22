import { useState } from "react";
import {
  Scale,
  Package,
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const arrivedBatches = [
  {
    id: "TB127",
    farmerId: "F001",
    farmerName: "Joseph Mwansa",
    crop: "Maize",
    declaredBags: 120,
    arrivalTime: "2026-04-21 14:15",
    status: "pending-weighing",
    actualWeight: null,
    variance: null,
  },
  {
    id: "TB124",
    farmerId: "F006",
    farmerName: "Ruth Mulenga",
    crop: "Maize",
    declaredBags: 110,
    arrivalTime: "2026-04-20 16:30",
    status: "weighed",
    actualWeight: 5500,
    variance: 0,
  },
  {
    id: "TB122",
    farmerId: "F003",
    farmerName: "John Banda",
    crop: "Soya Beans",
    declaredBags: 85,
    arrivalTime: "2026-04-20 11:45",
    status: "weighed",
    actualWeight: 4335,
    variance: 2.3,
  },
  {
    id: "TB120",
    farmerId: "F002",
    farmerName: "Mary Phiri",
    crop: "Groundnuts",
    declaredBags: 75,
    arrivalTime: "2026-04-19 15:20",
    status: "weighed",
    actualWeight: 3600,
    variance: -4.0,
  },
];

export function ShedProcurement() {
  const [selectedBatch, setSelectedBatch] = useState(arrivedBatches[0]);
  const [weighingWeight, setWeighingWeight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const calculateExpectedWeight = (bags: number) => {
    return bags * 50;
  };

  const calculateVariance = (actual: number, expected: number) => {
    return ((actual - expected) / expected) * 100;
  };

  const handleWeighSubmit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const actualWeight = parseFloat(weighingWeight);
      const expectedWeight = calculateExpectedWeight(selectedBatch.declaredBags);
      const variance = calculateVariance(actualWeight, expectedWeight);

      setSelectedBatch({
        ...selectedBatch,
        actualWeight,
        variance,
        status: "weighed",
      });
      setIsProcessing(false);
      setWeighingWeight("");
    }, 1500);
  };

  const getVarianceColor = (variance: number | null) => {
    if (variance === null) return "";
    if (variance > 5) return "text-destructive";
    if (variance < -5) return "text-destructive";
    if (Math.abs(variance) <= 2) return "text-secondary";
    return "text-accent";
  };

  const getVarianceIcon = (variance: number | null) => {
    if (variance === null) return null;
    if (variance > 0)
      return <TrendingUp className="w-4 h-4 inline-block ml-1" />;
    if (variance < 0)
      return <TrendingDown className="w-4 h-4 inline-block ml-1" />;
    return <CheckCircle className="w-4 h-4 inline-block ml-1" />;
  };

  const calculatePayment = (weight: number, pricePerKg: number = 8) => {
    return weight * pricePerKg;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Shed Procurement</h1>
        <p className="text-muted-foreground">
          Weighing, verification, and payment processing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Arrived Batches</h2>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {arrivedBatches.map((batch) => (
                <div
                  key={batch.id}
                  onClick={() => setSelectedBatch(batch)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedBatch.id === batch.id
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm text-card-foreground mb-1">
                        {batch.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {batch.farmerName}
                      </p>
                    </div>
                    {batch.status === "pending-weighing" ? (
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded-full text-xs">
                        Pending
                      </span>
                    ) : (
                      <CheckCircle className="w-5 h-5 text-secondary" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span>{batch.declaredBags} bags</span>
                    <span>{batch.crop}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl text-card-foreground mb-1">
                {selectedBatch.id}
              </h2>
              <p className="text-muted-foreground">{selectedBatch.farmerName}</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-primary" />
                    <p className="text-sm text-muted-foreground">Declared Bags</p>
                  </div>
                  <p className="text-2xl text-card-foreground">
                    {selectedBatch.declaredBags}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Est. {calculateExpectedWeight(selectedBatch.declaredBags)} kg
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-5 h-5 text-secondary" />
                    <p className="text-sm text-muted-foreground">Actual Weight</p>
                  </div>
                  {selectedBatch.actualWeight ? (
                    <>
                      <p className="text-2xl text-card-foreground">
                        {selectedBatch.actualWeight} kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Verified</p>
                    </>
                  ) : (
                    <p className="text-2xl text-muted-foreground">-</p>
                  )}
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    <p className="text-sm text-muted-foreground">Variance</p>
                  </div>
                  {selectedBatch.variance !== null ? (
                    <>
                      <p
                        className={`text-2xl ${getVarianceColor(
                          selectedBatch.variance
                        )}`}
                      >
                        {selectedBatch.variance > 0 ? "+" : ""}
                        {selectedBatch.variance.toFixed(1)}%
                        {getVarianceIcon(selectedBatch.variance)}
                      </p>
                      {Math.abs(selectedBatch.variance) > 5 ? (
                        <p className="text-xs text-destructive mt-1">
                          High variance - Review required
                        </p>
                      ) : Math.abs(selectedBatch.variance) <= 2 ? (
                        <p className="text-xs text-secondary mt-1">
                          Within acceptable range
                        </p>
                      ) : (
                        <p className="text-xs text-accent mt-1">
                          Moderate variance
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-2xl text-muted-foreground">-</p>
                  )}
                </div>
              </div>

              {selectedBatch.status === "pending-weighing" ? (
                <div className="border border-border rounded-lg p-6 bg-muted/10">
                  <h3 className="text-lg text-card-foreground mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Weighing Interface
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-card-foreground mb-2">
                        Enter Actual Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={weighingWeight}
                        onChange={(e) => setWeighingWeight(e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary text-2xl"
                      />
                    </div>

                    {weighingWeight && (
                      <div className="p-4 bg-accent/10 border border-accent/30 rounded-lg">
                        <p className="text-sm text-card-foreground mb-2">
                          Weight Comparison
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Expected</p>
                            <p className="text-card-foreground">
                              {calculateExpectedWeight(
                                selectedBatch.declaredBags
                              )}{" "}
                              kg
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Difference</p>
                            <p
                              className={getVarianceColor(
                                calculateVariance(
                                  parseFloat(weighingWeight),
                                  calculateExpectedWeight(
                                    selectedBatch.declaredBags
                                  )
                                )
                              )}
                            >
                              {calculateVariance(
                                parseFloat(weighingWeight),
                                calculateExpectedWeight(selectedBatch.declaredBags)
                              ) > 0
                                ? "+"
                                : ""}
                              {calculateVariance(
                                parseFloat(weighingWeight),
                                calculateExpectedWeight(selectedBatch.declaredBags)
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleWeighSubmit}
                      disabled={!weighingWeight || isProcessing}
                      className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? "Processing..." : "Submit Weight"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-secondary rounded-lg p-6 bg-secondary/5">
                  <h3 className="text-lg text-card-foreground mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    Weighing Completed
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Expected Weight</p>
                        <p className="text-card-foreground">
                          {calculateExpectedWeight(selectedBatch.declaredBags)} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Actual Weight</p>
                        <p className="text-card-foreground">
                          {selectedBatch.actualWeight} kg
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Variance</p>
                        <p
                          className={getVarianceColor(selectedBatch.variance)}
                        >
                          {selectedBatch.variance! > 0 ? "+" : ""}
                          {selectedBatch.variance!.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Status</p>
                        {Math.abs(selectedBatch.variance!) <= 5 ? (
                          <p className="text-secondary">Approved</p>
                        ) : (
                          <p className="text-destructive">Needs Review</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedBatch.actualWeight && (
            <div className="bg-card border border-border rounded-lg shadow-sm">
              <div className="p-6 border-b border-border">
                <h3 className="text-xl text-card-foreground flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Payment Generation
                </h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Crop Type</span>
                      <span className="text-card-foreground">
                        {selectedBatch.crop}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Total Weight</span>
                      <span className="text-card-foreground">
                        {selectedBatch.actualWeight} kg
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Price per kg</span>
                      <span className="text-card-foreground">ZMW 8.00</span>
                    </div>
                  </div>

                  <div className="p-6 bg-primary/5 border-2 border-primary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Total Payable Amount
                    </p>
                    <p className="text-4xl text-primary mb-1">
                      ZMW{" "}
                      {calculatePayment(selectedBatch.actualWeight).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Payment to {selectedBatch.farmerName}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Approve Payment
                  </button>
                  <button className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground">
                    Print Receipt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
