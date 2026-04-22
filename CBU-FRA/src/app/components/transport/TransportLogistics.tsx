import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  QrCode,
  User,
} from "lucide-react";

const transportBatches = [
  {
    id: "TB127",
    farmerId: "F001",
    farmerName: "Joseph Mwansa",
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
  const [selectedBatch, setSelectedBatch] = useState(transportBatches[0]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "collected":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
            <Package className="w-4 h-4" />
            Collected
          </span>
        );
      case "in-transit":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
            <Truck className="w-4 h-4" />
            In Transit
          </span>
        );
      case "arrived":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
            <CheckCircle className="w-4 h-4" />
            Arrived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Transport Logistics</h1>
        <p className="text-muted-foreground">
          Track and manage transport batches in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Active Batches</h2>
            </div>

            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {transportBatches.map((batch) => (
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
                    {getStatusBadge(batch.status)}
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

        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl text-card-foreground mb-1">
                    {selectedBatch.id}
                  </h2>
                  <p className="text-muted-foreground">Batch Details</p>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <QrCode className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg text-card-foreground">
                    Transport Timeline
                  </h3>
                  {getStatusBadge(selectedBatch.status)}
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-0.5 h-16 bg-secondary"></div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-card-foreground mb-1">
                      Collection Point
                    </p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {selectedBatch.collectionPoint}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Collected at {selectedBatch.dispatchTime}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedBatch.status === "in-transit" ||
                        selectedBatch.status === "arrived"
                          ? "bg-primary"
                          : "bg-muted"
                      }`}
                    >
                      <Truck
                        className={`w-5 h-5 ${
                          selectedBatch.status === "in-transit" ||
                          selectedBatch.status === "arrived"
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div
                      className={`w-0.5 h-16 ${
                        selectedBatch.status === "arrived"
                          ? "bg-secondary"
                          : "bg-muted"
                      }`}
                    ></div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-card-foreground mb-1">In Transit</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      Agent: {selectedBatch.agent}
                    </p>
                    {selectedBatch.status === "in-transit" && (
                      <p className="text-xs text-primary">Currently in transit</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedBatch.status === "arrived"
                          ? "bg-secondary"
                          : "bg-muted"
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 ${
                          selectedBatch.status === "arrived"
                            ? "text-white"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <p className="text-card-foreground mb-1">Arrived at Shed</p>
                    <p className="text-sm text-muted-foreground mb-1">
                      {selectedBatch.shed}
                    </p>
                    {selectedBatch.arrivalTime ? (
                      <p className="text-xs text-muted-foreground">
                        Arrived at {selectedBatch.arrivalTime}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Awaiting arrival
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                <div className="space-y-4">
                  <h3 className="text-lg text-card-foreground">
                    Farmer Information
                  </h3>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Farmer</p>
                        <p className="text-card-foreground">
                          {selectedBatch.farmerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {selectedBatch.farmerId}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Produce</p>
                        <p className="text-card-foreground">
                          {selectedBatch.crop}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBatch.declaredBags} bags declared
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg text-card-foreground">
                    GPS Tracking
                  </h3>

                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-card-foreground mb-1">
                          Current Location
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedBatch.gps.lat}° S, {selectedBatch.gps.lng}° E
                        </p>
                      </div>
                    </div>

                    <div className="h-32 bg-muted rounded border border-border flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">
                        GPS Map View
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex gap-4">
                  <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Generate QR Code
                  </button>
                  <button className="flex-1 px-6 py-3 border border-border rounded-lg hover:bg-muted/50 transition-colors text-card-foreground">
                    View Full History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
