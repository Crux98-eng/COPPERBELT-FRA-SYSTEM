import { useState } from "react";
import {
  MapPin,
  Warehouse,
  Users,
  Truck,
  Circle,
  Navigation,
} from "lucide-react";

const locations = [
  {
    id: 1,
    name: "Lusaka Collection Center",
    type: "collection",
    district: "Lusaka",
    coordinates: { lat: -15.4167, lng: 28.2833 },
    farmers: 2340,
    activeBatches: 12,
  },
  {
    id: 2,
    name: "Chipata Collection Center",
    type: "collection",
    district: "Chipata",
    coordinates: { lat: -13.6334, lng: 32.6503 },
    farmers: 3120,
    activeBatches: 18,
  },
  {
    id: 3,
    name: "Ndola Collection Center",
    type: "collection",
    district: "Ndola",
    coordinates: { lat: -12.9712, lng: 28.6366 },
    farmers: 1890,
    activeBatches: 9,
  },
  {
    id: 4,
    name: "Livingstone Collection Center",
    type: "collection",
    district: "Livingstone",
    coordinates: { lat: -17.8419, lng: 25.8544 },
    farmers: 1560,
    activeBatches: 7,
  },
  {
    id: 5,
    name: "Mongu Collection Center",
    type: "collection",
    district: "Mongu",
    coordinates: { lat: -15.2694, lng: 23.1459 },
    farmers: 2180,
    activeBatches: 11,
  },
  {
    id: 6,
    name: "Kasama Collection Center",
    type: "collection",
    district: "Kasama",
    coordinates: { lat: -10.2127, lng: 31.1807 },
    farmers: 1368,
    activeBatches: 6,
  },
  {
    id: 7,
    name: "Lusaka North Shed",
    type: "shed",
    district: "Lusaka",
    coordinates: { lat: -15.3875, lng: 28.3228 },
    capacity: "25,000 bags",
    current: "18,450 bags",
  },
  {
    id: 8,
    name: "Chipata Central Shed",
    type: "shed",
    district: "Chipata",
    coordinates: { lat: -13.6543, lng: 32.6234 },
    capacity: "30,000 bags",
    current: "22,100 bags",
  },
  {
    id: 9,
    name: "Ndola Regional Shed",
    type: "shed",
    district: "Ndola",
    coordinates: { lat: -12.9588, lng: 28.6503 },
    capacity: "20,000 bags",
    current: "15,230 bags",
  },
];

const routes = [
  {
    id: 1,
    from: "Lusaka Collection Center",
    to: "Lusaka North Shed",
    batches: 3,
    status: "active",
  },
  {
    id: 2,
    from: "Chipata Collection Center",
    to: "Chipata Central Shed",
    batches: 5,
    status: "active",
  },
  {
    id: 3,
    from: "Mongu Collection Center",
    to: "Lusaka North Shed",
    batches: 2,
    status: "active",
  },
];

export function LogisticsMap() {
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [filterType, setFilterType] = useState<string>("all");

  const filteredLocations = locations.filter(
    (loc) => filterType === "all" || loc.type === filterType
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl text-foreground mb-2">Logistics Map</h1>
        <p className="text-muted-foreground">
          Geographic view of collection points, sheds, and active routes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg text-card-foreground">Zambia Map View</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === "all"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted/50"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterType("collection")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === "collection"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted/50"
                  }`}
                >
                  Collection
                </button>
                <button
                  onClick={() => setFilterType("shed")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === "shed"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border hover:bg-muted/50"
                  }`}
                >
                  Sheds
                </button>
              </div>
            </div>

            <div className="relative h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 800 600"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M 200 150 L 550 120 L 600 200 L 580 450 L 480 520 L 350 500 L 250 480 L 180 350 Z"
                    fill="#F5F7FA"
                    stroke="#1B5E20"
                    strokeWidth="2"
                    opacity="0.3"
                  />

                  <text x="370" y="300" fontSize="24" fill="#0D1B2A" opacity="0.2">
                    ZAMBIA
                  </text>

                  {filteredLocations.map((location, idx) => {
                    const x = 200 + (location.coordinates.lng - 23) * 15;
                    const y = 150 + (location.coordinates.lat + 10) * 25;

                    return (
                      <g
                        key={location.id}
                        onClick={() => setSelectedLocation(location)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          r={location.type === "collection" ? "30" : "25"}
                          fill={
                            location.type === "collection" ? "#43A047" : "#F9A825"
                          }
                          opacity={
                            selectedLocation.id === location.id ? "1" : "0.7"
                          }
                          className="transition-all hover:opacity-100"
                        />

                        <circle
                          cx={x}
                          cy={y}
                          r={location.type === "collection" ? "35" : "30"}
                          fill="none"
                          stroke={
                            location.type === "collection" ? "#43A047" : "#F9A825"
                          }
                          strokeWidth="2"
                          opacity="0.3"
                          className="animate-pulse"
                        />

                        {location.type === "collection" ? (
                          <g transform={`translate(${x - 10}, ${y - 10})`}>
                            <circle cx="10" cy="10" r="8" fill="white" />
                            <text
                              x="10"
                              y="14"
                              fontSize="10"
                              fill="#43A047"
                              textAnchor="middle"
                            >
                              {location.activeBatches}
                            </text>
                          </g>
                        ) : (
                          <g transform={`translate(${x - 8}, ${y - 8})`}>
                            <rect
                              x="3"
                              y="3"
                              width="10"
                              height="10"
                              fill="white"
                            />
                            <rect
                              x="5"
                              y="5"
                              width="6"
                              height="6"
                              fill="#F9A825"
                            />
                          </g>
                        )}

                        <text
                          x={x}
                          y={y + 50}
                          fontSize="12"
                          fill="#0D1B2A"
                          textAnchor="middle"
                          className="pointer-events-none"
                        >
                          {location.district}
                        </text>
                      </g>
                    );
                  })}

                  {routes.map((route, idx) => {
                    const from = locations.find((l) => l.name === route.from);
                    const to = locations.find((l) => l.name === route.to);

                    if (!from || !to) return null;

                    const x1 = 200 + (from.coordinates.lng - 23) * 15;
                    const y1 = 150 + (from.coordinates.lat + 10) * 25;
                    const x2 = 200 + (to.coordinates.lng - 23) * 15;
                    const y2 = 150 + (to.coordinates.lat + 10) * 25;

                    return (
                      <g key={route.id}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#1B5E20"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          opacity="0.5"
                        />

                        <circle
                          cx={(x1 + x2) / 2}
                          cy={(y1 + y2) / 2}
                          r="12"
                          fill="#1B5E20"
                          className="animate-pulse"
                        />

                        <g
                          transform={`translate(${(x1 + x2) / 2 - 6}, ${
                            (y1 + y2) / 2 - 6
                          })`}
                        >
                          <path
                            d="M 6 2 L 10 6 L 6 10 L 6 7 L 2 7 L 2 5 L 6 5 Z"
                            fill="white"
                          />
                        </g>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="absolute top-4 left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
                <h3 className="text-sm text-card-foreground mb-3">Legend</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Circle className="w-5 h-5 fill-secondary text-secondary" />
                    <span className="text-muted-foreground">
                      Collection Center
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className="w-5 h-5 fill-accent text-accent" />
                    <span className="text-muted-foreground">Storage Shed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    <span className="text-muted-foreground">Active Route</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-card border border-border rounded-lg p-4 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-5 h-5 text-primary" />
                  <span className="text-card-foreground">
                    {routes.reduce((acc, r) => acc + r.batches, 0)} Active
                    Transport Batches
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg shadow-sm">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Location Details</h2>
            </div>

            <div className="p-4">
              {selectedLocation && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        selectedLocation.type === "collection"
                          ? "bg-secondary/10"
                          : "bg-accent/10"
                      }`}
                    >
                      {selectedLocation.type === "collection" ? (
                        <MapPin
                          className={`w-6 h-6 ${
                            selectedLocation.type === "collection"
                              ? "text-secondary"
                              : "text-accent"
                          }`}
                        />
                      ) : (
                        <Warehouse
                          className={`w-6 h-6 ${
                            selectedLocation.type === "collection"
                              ? "text-secondary"
                              : "text-accent"
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-card-foreground mb-1">
                        {selectedLocation.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedLocation.district} District
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Coordinates
                        </p>
                        <p className="text-sm text-card-foreground">
                          {selectedLocation.coordinates.lat.toFixed(4)}° S,{" "}
                          {selectedLocation.coordinates.lng.toFixed(4)}° E
                        </p>
                      </div>
                    </div>

                    {selectedLocation.type === "collection" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Registered Farmers
                            </p>
                            <p className="text-sm text-card-foreground">
                              {selectedLocation.farmers?.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Active Batches
                            </p>
                            <p className="text-sm text-card-foreground">
                              {selectedLocation.activeBatches}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Warehouse className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Capacity
                            </p>
                            <p className="text-sm text-card-foreground">
                              {selectedLocation.capacity}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Current Stock
                            </p>
                            <p className="text-sm text-card-foreground">
                              {selectedLocation.current}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                      View Full Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-sm mt-6">
            <div className="p-4 border-b border-border">
              <h2 className="text-lg text-card-foreground">Active Routes</h2>
            </div>

            <div className="divide-y divide-border">
              {routes.map((route) => (
                <div key={route.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-sm text-card-foreground">
                      {route.batches} batch{route.batches > 1 ? "es" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {route.from.replace(" Collection Center", "")} →{" "}
                    {route.to.replace(" Shed", "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Package({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16.5 9.4 7.55 4.24" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" x2="12" y1="22" y2="12" />
    </svg>
  );
}
