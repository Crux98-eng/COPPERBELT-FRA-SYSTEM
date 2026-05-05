import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Truck,
  CheckCircle,
  User,
  Bell,
  Calendar,
  Check,
} from "lucide-react";
import { useAuth } from "@/app/auth/AuthContext";
import { apiRequest } from "@/app/lib/api";
import { Skeleton } from "@/app/components/ui/skeleton";

interface Farmer {
  id: string;
  name: string;
  nrc: string;
  location: string;
  crop?: string;
  phone?: string;
  status?: string;
  bags?: number;
  shed?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  status: string;
  message: string;
  data: {
    farmers: Farmer[];
    total: number;
  };
}

const normalizeBatchStatus = (status?: string) =>
  status?.toLowerCase().replace(/_/g, "-") ?? "";

const getStatusLabel = (status?: string) => {
  const normalizedStatus = normalizeBatchStatus(status);

  if (normalizedStatus === "arrived") return "Arrived";
  if (normalizedStatus === "in-transit") return "In Transit";
  if (normalizedStatus === "collected") return "Collected";

  return status || "Unknown";
};

const getStatusClassName = (status?: string) => {
  const normalizedStatus = normalizeBatchStatus(status);

  if (normalizedStatus === "arrived") return "bg-secondary/10 text-secondary";
  if (normalizedStatus === "in-transit") return "bg-primary/10 text-primary";

  return "bg-accent/10 text-accent";
};

const getStatusIcon = (status?: string) => {
  const normalizedStatus = normalizeBatchStatus(status);

  if (normalizedStatus === "arrived") {
    return <CheckCircle className="w-4 h-4" />;
  }

  if (normalizedStatus === "in-transit") {
    return <Truck className="w-4 h-4" />;
  }

  if (normalizedStatus === "collected") {
    return <Package className="w-4 h-4" />;
  }

  return null;
};

export function TransportLogistics() {
  const [selectedFarmers, setSelectedFarmers] = useState<string[]>([]);
  const [buyingDate, setBuyingDate] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSending, setNotificationSending] = useState(false);
  const { token } = useAuth();

  const { data: farmersResponse, isLoading } = useQuery({
    queryKey: ["farmers", "list"],
    queryFn: () =>
      apiRequest<ApiResponse>("/mobile/farmers", {
        token,
      }),
  });

  const farmers = farmersResponse?.data.farmers ?? [];

  const farmersAtShed = farmers;

  const handleFarmerToggle = (farmerId: string) => {
    if (!farmerId) return;

    setSelectedFarmers((prev) =>
      prev.includes(farmerId)
        ? prev.filter((id) => id !== farmerId)
        : [...prev, farmerId],
    );
  };

  const handleSelectAll = () => {
    if (farmersAtShed.length === 0) return;

    if (selectedFarmers.length === farmersAtShed.length) {
      setSelectedFarmers([]);
      return;
    }

    setSelectedFarmers(
      farmersAtShed
        .map((farmer) => farmer.id)
        .filter((id): id is string => Boolean(id)),
    );
  };

  const handleSendNotification = async () => {
    if (selectedFarmers.length === 0 || !buyingDate) {
      alert("Please select farmers and a buying date");
      return;
    }

    setNotificationSending(true);
    try {
      const selectedFarmersData = farmersAtShed.filter((farmer) =>
        selectedFarmers.includes(farmer.id),
      );

      const payload = {
        farmers: selectedFarmersData.map((farmer) => ({
          farmer_id: farmer.id,
          farmer_name: farmer.name,
          phone: farmer.phone,
          crop: farmer.crop,
        })),
        buying_date: buyingDate,
        message: notificationMessage,
        message_type: "buying_day_invitation",
      };

      // console.log("Sending notification payload:", payload);
      alert(
        `Notifications sent to ${selectedFarmers.length} farmer(s) for buying day on ${buyingDate}`,
      );

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
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground mb-3">
                Farmers at Shed ({farmersAtShed.length})
              </h2>
              <button
                onClick={handleSelectAll}
                disabled={farmersAtShed.length === 0}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {farmersAtShed.length > 0 &&
                selectedFarmers.length === farmersAtShed.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-350px)] overflow-y-auto">
              {farmersAtShed.length > 0 ? (
                farmersAtShed.map((farmer) => (
                  <div
                    key={farmer.id}
                    className="p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedFarmers.includes(farmer.id)}
                        onChange={() => handleFarmerToggle(farmer.id)}
                        className="w-5 h-5 mt-0.5 rounded border-2 border-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-card-foreground font-medium">
                          {farmer.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-1">
                          {farmer.phone || "No phone"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Package className="w-3 h-3" />
                          <span>{farmer.crop || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary rounded mt-2">
                            <CheckCircle className="w-3 h-3" />
                            {farmer.bags || 0} bags
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
                      .filter((farmer) => selectedFarmers.includes(farmer.id))
                      .map((farmer) => (
                        <div
                          key={farmer.id}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                        >
                          <Check className="w-4 h-4" />
                          {farmer.name || "Unknown"}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No farmers selected yet
                  </p>
                )}
              </div>

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
                  onChange={(event) => setBuyingDate(event.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm text-card-foreground mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Bell className="w-4 h-4 text-accent" />
                    Custom Message (Optional)
                  </div>
                </label>
                <textarea
                  value={notificationMessage}
                  onChange={(event) =>
                    setNotificationMessage(event.target.value)
                  }
                  placeholder="Enter an optional custom message to include in the notification..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-input-background text-card-foreground min-h-[100px] focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Notification Preview:
                </p>
                <div className="text-sm text-card-foreground space-y-2">
                  <p>
                    Hello, we invite you to bring your{" "}
                    {selectedFarmers.length > 0
                      ? farmersAtShed
                          .filter((farmer) => selectedFarmers.includes(farmer.id))
                          .map((farmer) => farmer.crop || "produce")
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
                  {notificationMessage && (
                    <p className="italic">{notificationMessage}</p>
                  )}
                  <p>- Food Reserve Agency</p>
                </div>
              </div>

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
                    : `Send to ${selectedFarmers.length} Farmer${
                        selectedFarmers.length !== 1 ? "s" : ""
                      }`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-card border border-border rounded-lg shadow-sm">
          <div className="p-4 border-b border-border">
            <h3 className="text-lg text-card-foreground">
              All Transport Batches
            </h3>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="p-4">
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              ))
            ) : farmers.length > 0 ? (
              farmers.map((farmer) => {
                const status = normalizeBatchStatus(farmer.status);
                const isArrived = status === "arrived";

                return (
                  <div
                    key={farmer.id}
                    className={`p-4 ${isArrived ? "bg-secondary/5" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <p className="text-sm text-card-foreground font-medium">
                          {farmer.id} - {farmer.name || "Unknown Farmer"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {farmer.crop || "N/A"} - {farmer.bags || 0} bags
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${getStatusClassName(
                          farmer.status,
                        )}`}
                      >
                        {getStatusIcon(farmer.status)}
                        {getStatusLabel(farmer.status)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {farmer.phone || "No phone"} - Shed:{" "}
                      {farmer.shed || "No shed assigned"}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No farmers found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
