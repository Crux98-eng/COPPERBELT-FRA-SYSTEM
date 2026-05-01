import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  User,
  Bell,
  Calendar,
  Check,
} from "lucide-react";

const transportBatches = [
  {
    id: "TB127",
    farmerId: "F001",
    farmerName: "Joseph Mwansa",
    phone: "+260978123456",
    crop: "Maize",
    declaredBags: 120,
    status: "arrived",
    collectionPoint: "Chipata Collection Center",
    shed: "Chipata Central Shed",
    agent: "Michael Phiri",
    dispatchTime: "2026-04-21 08:30",
    arrivalTime: "2026-04-21 14:15",
    gps: { lat: -13.6334, lng: 32.6503 },
  },
  {
    id: "TB126",
    farmerId: "F004",
    farmerName: "Grace Siame",
    phone: "+260978123457",
    crop: "Maize",
    declaredBags: 95,
    status: "in-transit",
    collectionPoint: "Mongu Collection Center",
    shed: "Mongu Regional Shed",
    agent: "Sarah Mwale",
    dispatchTime: "2026-04-21 06:00",
    arrivalTime: null,
    gps: { lat: -15.2694, lng: 23.1459 },
  },
  {
    id: "TB125",
    farmerId: "F002",
    farmerName: "Mary Phiri",
    phone: "+260978123458",
    crop: "Groundnuts",
    declaredBags: 80,
    status: "collected",
    collectionPoint: "Lusaka Collection Center",
    shed: "Lusaka North Shed",
    agent: "James Banda",
    dispatchTime: "2026-04-21 10:00",
    arrivalTime: null,
    gps: { lat: -15.4167, lng: 28.2833 },
  },
  {
    id: "TB124",
    farmerId: "F006",
    farmerName: "Ruth Mulenga",
    phone: "+260978123459",
    crop: "Maize",
    declaredBags: 110,
    status: "arrived",
    collectionPoint: "Kasama Collection Center",
    shed: "Kasama Shed",
    agent: "Peter Zulu",
    dispatchTime: "2026-04-20 07:00",
    arrivalTime: "2026-04-20 16:30",
    gps: { lat: -10.2127, lng: 31.1807 },
  },
  {
    id: "TB123",
    farmerId: "F008",
    farmerName: "Alice Tembo",
    phone: "+260978123460",
    crop: "Maize",
    declaredBags: 105,
    status: "in-transit",
    collectionPoint: "Lusaka Collection Center",
    shed: "Lusaka South Shed",
    agent: "David Lungu",
    dispatchTime: "2026-04-21 09:15",
    arrivalTime: null,
    gps: { lat: -15.4167, lng: 28.2833 },
  },
];

export function TransportLogistics() {
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [buyingDate, setBuyingDate] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSending, setNotificationSending] = useState(false);

  // Filter farmers who have arrived at shed
  const farmersAtShed = transportBatches.filter((batch) => batch.status === "arrived");

  const handleFarmerToggle = (farmerId: string) => {
    setSelectedFarmers((prev) =>
      prev.includes(farmerId)
        ? prev.filter((id) => id !== farmerId)
        : [...prev, farmerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFarmers.length === farmersAtShed.length) {
      setSelectedFarmers([]);
    } else {
      setSelectedFarmers(farmersAtShed.map((batch) => batch.farmerId));
    }
  };

  const handleSendNotification = async () => {
    if (selectedFarmers.length === 0 || !buyingDate) {
      alert("Please select farmers and a buying date");
      return;
    }

    setNotificationSending(true);
    try {
      // Simulate API call to send notifications
      const selectedBatches = farmersAtShed.filter((batch) =>
        selectedFarmers.includes(batch.farmerId)
      );

      const payload = {
        farmers: selectedBatches.map((batch) => ({
          farmer_id: batch.farmerId,
          farmer_name: batch.farmerName,
          phone: batch.phone,
          crop: batch.crop,
        })),
        buying_date: buyingDate,
        message: notificationMessage,
        message_type: "buying_day_invitation",
      };

      console.log("Sending notification payload:", payload);

      // Simulate successful send
      alert(
        `Notifications sent to ${selectedFarmers.length} farmer(s) for buying day on ${buyingDate}`
      );

      // Reset form
      setSelectedFarmers([]);
      setBuyingDate("");
      setNotificationMessage("");
    } catch (error) {
      console.error("Failed to send notifications:", error);
      alert("Failed to send notifications");
    } finally {
      setNotificationSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">SEND REQUEST TO FARMERS</h1>
        <p className="text-muted-foreground">
          Manage farmers at shed and schedule buying day notifications
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Farmers at Shed List */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground mb-3">
                Farmers at Shed ({farmersAtShed.length})
              </h2>
              <button
                onClick={handleSelectAll}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {selectedFarmers.length === farmersAtShed.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-350px)] overflow-y-auto">
              {farmersAtShed.length > 0 ? (
                farmersAtShed.map((batch) => (
                  <div
                    key={batch.farmerId}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFarmers.includes(batch.farmerId)}
                        onChange={() => handleFarmerToggle(batch.farmerId)}
                        className="w-5 h-5 mt-0.5 rounded border-2 border-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground font-medium">
                          {batch.farmerName}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {batch.farmerId}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          <span>{batch.crop}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary rounded mt-2">
                            <CheckCircle className="w-3 h-3" />
                            {batch.declaredBags} bags
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No farmers at shed yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl text-card-foreground mb-1">
                Schedule Buying Day Notifications
              </h2>
              <p className="text-muted-foreground text-sm">
                Send invitations to selected farmers for crop buying day
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Selected Farmers Summary */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-sm text-card-foreground font-medium">
                    Selected Farmers
                  </h3>
                </div>
                {selectedFarmers.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {farmersAtShed
                      .filter((batch) => selectedFarmers.includes(batch.farmerId))
                      .map((batch) => (
                        <div
                          key={batch.farmerId}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          <Check className="w-4 h-4" />
                          {batch.farmerName}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No farmers selected yet
                  </p>
                )}
              </div>

              {/* Buying Date */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-primary" />
                    Buying Day Date
                  </div>
                </label>
                <input
                  type="date"
                  value={buyingDate}
                  onChange={(e) => setBuyingDate(e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Notification Message */}
              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-accent" />
                    Custom Message (Optional)
                  </div>
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter an optional custom message to include in the notification..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background text-card-foreground min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Message Preview */}
              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Notification Preview:
                </p>
                <div className="text-sm text-card-foreground space-y-2">
                  <p>
                    Hello, we invite you to bring your {selectedFarmers.length > 0 && farmersAtShed.length > 0
                      ? farmersAtShed
                          .filter((b) => selectedFarmers.includes(b.farmerId))
                          .map((b) => b.crop)
                          .join(", ")
                      : "produce"}{" "}
                    for the buying day on{" "}
                    <span className="font-medium">
                      {buyingDate
                        ? new Date(buyingDate).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "[Select a date]"}
                    </span>
                  </p>
                  {notificationMessage && <p className="italic">{notificationMessage}</p>}
                  <p>- Food Reserve Agency</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setSelectedFarmers([]);
                    setBuyingDate("");
                    setNotificationMessage("");
                  }}
                  className="px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground"
                >
                  Clear Form
                </button>
                <button
                  onClick={handleSendNotification}
                  disabled={
                    notificationSending ||
                    selectedFarmers.length === 0 ||
                    !buyingDate
                  }
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  {notificationSending
                    ? "Sending..."
                    : `Send to ${selectedFarmers.length} Farmer${selectedFarmers.length !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Summary for Reference */}
      <div className="mt-6">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg text-card-foreground">
              All Transport Batches
            </h3>
          </div>
          <div className="divide-y divide-border">
            {transportBatches.map((batch) => (
              <div
                key={batch.id}
                className={`p-4 ${
                  batch.status === "arrived" ? "bg-secondary/5" : ""
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm text-card-foreground font-medium">
                      {batch.id} - {batch.farmerName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {batch.crop} • {batch.declaredBags} bags
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                      batch.status === "arrived"
                        ? "bg-secondary/10 text-secondary"
                        : batch.status === "in-transit"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {batch.status === "arrived" && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {batch.status === "in-transit" && (
                      <Truck className="w-4 h-4" />
                    )}
                    {batch.status === "collected" && (
                      <Package className="w-4 h-4" />
                    )}
                    {batch.status === "arrived"
                      ? "Arrived"
                      : batch.status === "in-transit"
                      ? "In Transit"
                      : "Collected"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {batch.shed} • Agent: {batch.agent}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

