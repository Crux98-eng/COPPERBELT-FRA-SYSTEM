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

  const [nrc, setNrc] = useState("");
  const [items, setItems] = useState<{ crop: string; weight: string }[]>([
    { crop: "", weight: "" },
  ]);
  const [review, setReview] = useState<{
    nrc: string;
    items: { crop: string; weight: number; amount: number }[];
    totalWeight: number;
    totalAmount: number;
  } | null>(null);
  const [error, setError] = useState("");

  const updateItem = (
    index: number,
    field: "crop" | "weight",
    value: string,
  ) => {
    setReview(null);
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const addItem = () => {
    setReview(null);
    setItems((current) => [...current, { crop: "", weight: "" }]);
  };

  const removeItem = (index: number) => {
    setReview(null);
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleProcurementSubmit = () => {
    setError("");

    if (!nrc.trim()) {
      setError("Please enter the farmer's NRC number.");
      return;
    }

    const normalizedItems = items.map((item) => ({
      crop: item.crop.trim(),
      weight: Number(item.weight),
    }));

    if (normalizedItems.length === 0) {
      setError("Add at least one crop and weight pair.");
      return;
    }

    if (
      normalizedItems.some(
        (item) => !item.crop || isNaN(item.weight) || item.weight <= 0,
      )
    ) {
      setError("Each row must include a crop and a valid weight.");
      return;
    }

    const reviewItems = normalizedItems.map((item) => ({
      ...item,
      amount: calculatePayment(item.weight),
    }));

    const totalWeight = reviewItems.reduce((sum, item) => sum + item.weight, 0);
    const totalAmount = reviewItems.reduce((sum, item) => sum + item.amount, 0);

    setReview({
      nrc: nrc.trim(),
      items: reviewItems,
      totalWeight,
      totalAmount,
    });
  };

  const handleFinalSubmit = () => {
    if (!review) return;
    setError("");
    // TODO: replace with backend submission call
    console.log("Submitting procurement review", review);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Shed Procurement</h1>
        <p className="text-muted-foreground">
          Record purchased crops, review weights, and calculate payment.
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
                  onClick={() => {
                    setSelectedBatch(batch);
                    setReview(null);
                  }}
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
                    <p className="text-sm text-muted-foreground">Crop Type</p>
                  </div>
                  <p className="text-2xl text-card-foreground">
                    {selectedBatch.crop}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Arrival at {selectedBatch.arrivalTime}
                  </p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-accent" />
                    <p className="text-sm text-muted-foreground">Status</p>
                  </div>
                  <p className="text-2xl text-card-foreground">
                    {selectedBatch.status}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedBatch.declaredBags} bag shipment
                  </p>
                </div>
              </div>

              <div className="border border-border rounded-lg p-6 bg-muted/10">
                <h3 className="text-lg text-card-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-secondary" />
                  Procurement Review
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm text-card-foreground mb-2">
                      Farmer NRC
                    </label>
                    <input
                      type="text"
                      placeholder="Enter NRC number"
                      value={nrc}
                      onChange={(e) => {
                        setReview(null);
                        setNrc(e.target.value);
                      }}
                      className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="grid gap-4 md:grid-cols-[2fr_1fr_auto] items-end"
                      >
                        <div>
                          <label className="block text-sm text-card-foreground mb-2">
                            Crop
                          </label>
                          <select
                            value={item.crop}
                            onChange={(e) => updateItem(index, "crop", e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Select crop</option>
                            <option value="Maize">Maize</option>
                            <option value="Groundnuts">Groundnuts</option>
                            <option value="Soya Beans">Soya Beans</option>
                            <option value="Cotton">Cotton</option>
                            <option value="Sunflower">Sunflower</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-card-foreground mb-2">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="0.0"
                            value={item.weight}
                            onChange={(e) => updateItem(index, "weight", e.target.value)}
                            className="w-full px-4 py-3 border border-border rounded-md bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                          className="h-12 px-4 py-3 text-sm border border-border rounded-md bg-destructive/5 text-destructive hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    Add Crop
                  </button>

                  {error && (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleProcurementSubmit}
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Procurement Review
                  </button>
                </div>
              </div>

              {review && (
                <div className="bg-card border border-border rounded-lg shadow-sm mt-6">
                  <div className="p-6 border-b border-border">
                    <h3 className="text-xl text-card-foreground mb-1">
                      Purchase Review
                    </h3>
                    <p className="text-muted-foreground">
                      NRC: {review.nrc}
                    </p>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="text-muted-foreground border-b border-border">
                          <tr>
                            <th className="pb-3">Crop</th>
                            <th className="pb-3">Weight (kg)</th>
                            <th className="pb-3">Amount (ZMW)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {review.items.map((item, index) => (
                            <tr key={index} className="border-b border-border">
                              <td className="py-3 text-card-foreground">{item.crop}</td>
                              <td className="py-3 text-card-foreground">{item.weight.toFixed(1)}</td>
                              <td className="py-3 text-card-foreground">{item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Weight</p>
                        <p className="text-2xl text-card-foreground">
                          {review.totalWeight.toFixed(1)} kg
                        </p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl text-card-foreground">
                          ZMW {review.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Submit Procurement
                      </button>
                    </div>
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
