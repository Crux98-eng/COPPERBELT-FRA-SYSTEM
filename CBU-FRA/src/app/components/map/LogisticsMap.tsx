import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type LngLat = [number, number];
type TruckStatus = "in_transit" | "at_shed" | "loading" | "delayed";
type LocationType = "collection" | "shed";

interface Location {
  id: string;
  name: string;
  city: string;
  type: LocationType;
  coordinates: { lat: number; lng: number };
}

interface Route {
  id: number;
  fromId: string;
  toId: string;
}

interface Truck {
  id: string;
  label: string;
  routeId: number;
  position: LngLat;
  speed: number;
  status: TruckStatus;
  cargo: string;
  driver: string;
  eta: string; // human-readable, updated dynamically
  marker?: Marker;
  arrived: boolean;
  progressPct: number; // 0–100
  startPosition: LngLat;
}

// ─────────────────────────────────────────────
// MOCK DATA  (swap for API later)
// ─────────────────────────────────────────────
export const LOCATIONS: Location[] = [
  { id: "lusaka_cc",    name: "Lusaka Collection Center",  city: "Lusaka",  type: "collection", coordinates: { lat: -15.4167, lng: 28.2833 } },
  { id: "lusaka_shed",  name: "Lusaka North Shed",         city: "Lusaka",  type: "shed",       coordinates: { lat: -15.3875, lng: 28.3228 } },
  { id: "chipata_cc",   name: "Chipata Collection Center", city: "Chipata", type: "collection", coordinates: { lat: -13.6334, lng: 32.6503 } },
  { id: "chipata_shed", name: "Chipata Central Shed",      city: "Chipata", type: "shed",       coordinates: { lat: -13.6543, lng: 32.6234 } },
  { id: "mongu_cc",     name: "Mongu Collection Center",   city: "Mongu",   type: "collection", coordinates: { lat: -15.2694, lng: 23.1459 } },
  { id: "ndola_cc",     name: "Ndola Collection Center",   city: "Ndola",   type: "collection", coordinates: { lat: -12.9700, lng: 28.6360 } },
  { id: "ndola_shed",   name: "Ndola East Shed",           city: "Ndola",   type: "shed",       coordinates: { lat: -12.9500, lng: 28.6600 } },
];

export const ROUTES: Route[] = [
  { id: 1, fromId: "lusaka_cc",  toId: "lusaka_shed"  },
  { id: 2, fromId: "chipata_cc", toId: "chipata_shed" },
  { id: 3, fromId: "mongu_cc",   toId: "lusaka_shed"  },
  { id: 4, fromId: "ndola_cc",   toId: "ndola_shed"   },
];

const mkTruck = (
  id: string, label: string, routeId: number,
  status: TruckStatus, driver: string, cargo: string,
  progressPct: number, speed: number
): Truck => {
  const route = ROUTES.find(r => r.id === routeId)!;
  const from = LOCATIONS.find(l => l.id === route.fromId)!;
  const to   = LOCATIONS.find(l => l.id === route.toId)!;
  const start: LngLat = [from.coordinates.lng, from.coordinates.lat];
  const end: LngLat   = [to.coordinates.lng,   to.coordinates.lat];
  const frac = progressPct / 100;
  const pos: LngLat = [
    start[0] + (end[0] - start[0]) * frac,
    start[1] + (end[1] - start[1]) * frac,
  ];
  return { id, label, routeId, position: pos, speed, status, cargo, driver,
           eta: "—", marker: undefined, arrived: status === "at_shed",
           progressPct, startPosition: start };
};

export const INITIAL_TRUCKS: Truck[] = [
  mkTruck("T1","ZMB-001", 1, "in_transit", "Chanda Mwamba",  "Soya beans",   35, 60),
  mkTruck("T2","ZMB-002", 1, "loading",    "Bwalya Kunda",   "Maize",         0, 55),
  mkTruck("T3","ZMB-003", 2, "in_transit", "Mutale Phiri",   "Fertiliser",   62, 50),
  mkTruck("T4","ZMB-004", 2, "at_shed",    "Kalunga Banda",  "Sun flower",  100, 65),
  mkTruck("T5","ZMB-005", 3, "in_transit", "Mwape Zulu",     "Groundnuts",     18, 45),
  mkTruck("T6","ZMB-006", 3, "delayed",    "Tembo Lungu",    "Cotton",       40, 30),
  mkTruck("T7","ZMB-007", 4, "in_transit", "Kapaso Mulenga", "Seed",  75, 70),
  mkTruck("T8","ZMB-008", 4, "at_shed",    "Sichone Daka",   "Maize",       100, 60),
];

// ─────────────────────────────────────────────
// ROUTE LINE COLORS  (one per route id)
// ─────────────────────────────────────────────
const ROUTE_COLORS: Record<number, string> = {
  1: "#22d3ee",
  2: "#a78bfa",
  3: "#fb923c",
  4: "#34d399",
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const CITIES = ["All", "Lusaka", "Chipata", "Mongu", "Ndola"];

const STATUS_META: Record<TruckStatus, { label: string; color: string; dot: string }> = {
  in_transit: { label: "In Transit", color: "#22d3ee",  dot: "#22d3ee" },
  at_shed:    { label: "At Shed",    color: "#4ade80",  dot: "#4ade80" },
  loading:    { label: "Loading",    color: "#facc15",  dot: "#facc15" },
  delayed:    { label: "Delayed",    color: "#f87171",  dot: "#f87171" },
};

const truckMarkerEl = (status: TruckStatus): HTMLElement => {
  const el = document.createElement("div");
  const c = STATUS_META[status].dot;
  el.style.cssText = `
    width:28px; height:28px; border-radius:50%;
    background:${c}22; border:2.5px solid ${c};
    display:flex; align-items:center; justify-content:center;
    font-size:13px; cursor:pointer; transition:transform .2s;
    box-shadow: 0 0 10px ${c}88;
  `;
  el.textContent = "🚛";
  return el;
};

const locationMarkerEl = (type: LocationType): HTMLElement => {
  const el = document.createElement("div");
  const isCollection = type === "collection";
  el.style.cssText = `
    width:16px; height:16px; border-radius:${isCollection ? "50%" : "3px"};
    background:${isCollection ? "#4ade80" : "#f97316"};
    border: 2.5px solid #fff3; box-shadow: 0 0 8px #0008;
  `;
  return el;
};

const lerpLngLat = (a: LngLat, b: LngLat, t: number): LngLat =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

const dist = (a: LngLat, b: LngLat) =>
  Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2);

const getEndpoint = (routeId: number): LngLat | null => {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route) return null;
  const to = LOCATIONS.find(l => l.id === route.toId);
  if (!to) return null;
  return [to.coordinates.lng, to.coordinates.lat];
};

const getStartpoint = (routeId: number): LngLat | null => {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route) return null;
  const from = LOCATIONS.find(l => l.id === route.fromId);
  if (!from) return null;
  return [from.coordinates.lng, from.coordinates.lat];
};

const cityForRoute = (routeId: number, side: "from" | "to"): string => {
  const route = ROUTES.find(r => r.id === routeId);
  if (!route) return "";
  const locId = side === "from" ? route.fromId : route.toId;
  return LOCATIONS.find(l => l.id === locId)?.city ?? "";
};

// ── Route line layer helpers ──────────────────

const routeLayerId       = (truckId: string, kind: "traveled" | "remaining") => `route-${truckId}-${kind}`;
const routeSourceId      = (truckId: string, kind: "traveled" | "remaining") => `src-route-${truckId}-${kind}`;

const addRouteLayers = (map: Map, truck: Truck) => {
  const color   = ROUTE_COLORS[truck.routeId] ?? "#ffffff";
  const start   = getStartpoint(truck.routeId)!;
  const end     = getEndpoint(truck.routeId)!;

  // traveled segment  (origin → current position)
  const traveledSrcId  = routeSourceId(truck.id, "traveled");
  const traveledLayId  = routeLayerId(truck.id, "traveled");
  if (!map.getSource(traveledSrcId)) {
    map.addSource(traveledSrcId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [start, truck.position] },
      },
    });
    map.addLayer({
      id: traveledLayId,
      type: "line",
      source: traveledSrcId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": color,
        "line-width": 2,
        "line-opacity": 0.25,
        "line-dasharray": [2, 3],
      },
    });
  }

  // remaining segment  (current position → destination)
  const remainSrcId = routeSourceId(truck.id, "remaining");
  const remainLayId = routeLayerId(truck.id, "remaining");
  if (!map.getSource(remainSrcId)) {
    map.addSource(remainSrcId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [truck.position, end] },
      },
    });
    map.addLayer({
      id: remainLayId,
      type: "line",
      source: remainSrcId,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": color,
        "line-width": 3,
        "line-opacity": 0.6,
      },
    });
  }
};

const updateRouteLines = (map: Map, truck: Truck) => {
  const start = getStartpoint(truck.routeId)!;
  const end   = getEndpoint(truck.routeId)!;

  const traveledSrc = map.getSource(routeSourceId(truck.id, "traveled")) as maplibregl.GeoJSONSource | undefined;
  traveledSrc?.setData({
    type: "Feature", properties: {},
    geometry: { type: "LineString", coordinates: [start, truck.position] },
  });

  const remainSrc = map.getSource(routeSourceId(truck.id, "remaining")) as maplibregl.GeoJSONSource | undefined;
  remainSrc?.setData({
    type: "Feature", properties: {},
    geometry: { type: "LineString", coordinates: [truck.position, end] },
  });
};

const highlightRouteLines = (map: Map, truck: Truck, selected: boolean) => {
  const remainLayId  = routeLayerId(truck.id, "remaining");
  const traveledLayId = routeLayerId(truck.id, "traveled");
  if (!map.getLayer(remainLayId)) return;
  map.setPaintProperty(remainLayId,  "line-opacity", selected ? 1   : 0.6);
  map.setPaintProperty(remainLayId,  "line-width",   selected ? 5   : 3);
  map.setPaintProperty(traveledLayId,"line-opacity", selected ? 0.5 : 0.25);
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function LogisticsMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const intervalRef = useRef<number | null>(null);
  const trucksRef = useRef<Truck[]>(INITIAL_TRUCKS.map(t => ({ ...t })));
  const [trucks, setTrucks] = useState<Truck[]>(INITIAL_TRUCKS.map(t => ({ ...t })));
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Filtered trucks for sidebar
  const filteredTrucks = trucks.filter(t => {
    if (selectedCity === "All") return true;
    return (
      cityForRoute(t.routeId, "from") === selectedCity ||
      cityForRoute(t.routeId, "to")   === selectedCity
    );
  });

  const counts = {
    in_transit: trucks.filter(t => t.status === "in_transit").length,
    at_shed:    trucks.filter(t => t.status === "at_shed").length,
    loading:    trucks.filter(t => t.status === "loading").length,
    delayed:    trucks.filter(t => t.status === "delayed").length,
  };

  // ── Map init ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [28.5, -14.5],
      zoom: 5.2,
    });
    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      // Location markers
      LOCATIONS.forEach(loc => {
        const el = locationMarkerEl(loc.type);
        const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
          .setHTML(`<div style="font-family:arial;font-size:11px;color:#111">
            <strong>${loc.name}</strong><br/>${loc.city} · ${loc.type}
          </div>`);
        new maplibregl.Marker({ element: el })
          .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
          .setPopup(popup)
          .addTo(map);
      });

      // Route lines (drawn BEFORE truck markers so lines sit underneath)
      trucksRef.current.forEach(truck => {
        addRouteLayers(map, truck);
      });

      // Truck markers
      trucksRef.current.forEach(truck => {
        const el = truckMarkerEl(truck.status);
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat(truck.position)
          .addTo(map);
        el.addEventListener("click", () =>
          setSelectedTruck(id => id === truck.id ? null : truck.id)
        );
        truck.marker = marker;
      });

      // Simulation loop
      intervalRef.current = window.setInterval(() => {
        let changed = false;
        trucksRef.current.forEach(truck => {
          if (truck.status !== "in_transit") return;
          const target = getEndpoint(truck.routeId);
          const start  = getStartpoint(truck.routeId);
          if (!target || !start) return;

          const step = truck.speed * 0.000012;
          const d = dist(truck.position, target);
          if (d < 0.002) {
            truck.position = target;
            truck.status = "at_shed";
            truck.arrived = true;
            truck.progressPct = 100;
          } else {
            const dx = target[0] - truck.position[0];
            const dy = target[1] - truck.position[1];
            truck.position = [
              truck.position[0] + (dx / d) * step,
              truck.position[1] + (dy / d) * step,
            ];
            const totalDist = dist(start, target);
            const traveled  = dist(start, truck.position);
            truck.progressPct = Math.min(100, Math.round((traveled / totalDist) * 100));
            const remaining = dist(truck.position, target);
            const hrs = (remaining / (truck.speed * 0.000012 * 10 * 3600)) * 3600;
            truck.eta = `~${Math.max(1, Math.round(hrs / 60))} min`;
          }
          truck.marker?.setLngLat(truck.position);
          updateRouteLines(map, truck);
          changed = true;
        });
        if (changed) {
          setTrucks(trucksRef.current.map(t => ({ ...t })));
          setTick(n => n + 1);
        }
      }, 100);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Fly to selected truck
  useEffect(() => {
    if (!mapInstance.current) return;
    const map = mapInstance.current;
    // Dim all routes first
    trucksRef.current.forEach(t => highlightRouteLines(map, t, false));
    if (!selectedTruck) return;
    const truck = trucksRef.current.find(t => t.id === selectedTruck);
    if (!truck) return;
    highlightRouteLines(map, truck, true);
    map.flyTo({ center: truck.position, zoom: 8, duration: 800 });
  }, [selectedTruck]);

  const selectedTruckData = trucks.find(t => t.id === selectedTruck) ?? null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: "#0d1117", color: "#e2e8f0",
      fontFamily: "'arial',monospace",
    }}>

      {/* ── HEADER ─────────────────────────── */}
      <header style={{
        padding: "14px 24px", borderBottom: "1px solid #1e2a38",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#0d1117",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🚛</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 2, color: "#f0f6ff", textTransform: "uppercase" }}>
              ZambiaFreight
            </div>
            <div style={{ fontSize: 10, color: "#4a6080", letterSpacing: 3, textTransform: "uppercase" }}>
              Fleet Operations · Live View
            </div>
          </div>
        </div>

        {/* City filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {CITIES.map(city => (
            <button key={city} onClick={() => setSelectedCity(city)} style={{
              padding: "5px 13px", borderRadius: 4,
              border: selectedCity === city ? "1px solid #22d3ee" : "1px solid #1e2a38",
              background: selectedCity === city ? "#22d3ee18" : "transparent",
              color: selectedCity === city ? "#22d3ee" : "#4a6080",
              cursor: "pointer", fontSize: 11, letterSpacing: 1,
              textTransform: "uppercase", transition: "all .15s",
            }}>
              {city}
            </button>
          ))}
        </div>

        {/* Status pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {(Object.entries(counts) as [TruckStatus, number][]).map(([s, n]) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: STATUS_META[s].dot }} />
              <span style={{ fontSize: 10, color: "#4a6080", textTransform: "uppercase", letterSpacing: 1 }}>
                {STATUS_META[s].label}
              </span>
              <span style={{ fontSize: 12, color: STATUS_META[s].dot, fontWeight: 700 }}>{n}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── BODY ───────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* SIDEBAR */}
        <aside style={{
          width: 280, borderRight: "1px solid #1e2a38",
          overflowY: "auto", padding: "12px 0",
          background: "#0a0f16",
        }}>
          <div style={{ padding: "0 16px 8px", fontSize: 9, color: "#2e4058", letterSpacing: 3, textTransform: "uppercase" }}>
            {filteredTrucks.length} trucks · {selectedCity}
          </div>

          {filteredTrucks.map(truck => {
            const meta = STATUS_META[truck.status];
            const isSelected = selectedTruck === truck.id;
            return (
              <div key={truck.id} onClick={() => setSelectedTruck(id => id === truck.id ? null : truck.id)}
                style={{
                  padding: "10px 16px", cursor: "pointer",
                  borderLeft: isSelected ? `3px solid ${meta.dot}` : "3px solid transparent",
                  background: isSelected ? `${meta.dot}0d` : "transparent",
                  borderBottom: "1px solid #0f1923",
                  transition: "background .15s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: "#cdd9e5" }}>{truck.label}</span>
                  <span style={{
                    fontSize: 9, padding: "2px 6px", borderRadius: 2,
                    background: `${meta.dot}22`, color: meta.dot,
                    letterSpacing: 1, textTransform: "uppercase",
                  }}>{meta.label}</span>
                </div>
                <div style={{ fontSize: 10, color: "#3d5470", marginTop: 4 }}>
                  {truck.driver}
                </div>
                <div style={{ fontSize: 10, color: "#3d5470" }}>{truck.cargo}</div>

                {/* Progress bar */}
                <div style={{ marginTop: 8, height: 3, background: "#1a2535", borderRadius: 2 }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${truck.progressPct}%`,
                    background: meta.dot,
                    transition: "width .3s",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                  <span style={{ fontSize: 9, color: "#2e4058" }}>{truck.progressPct}%</span>
                  {truck.status === "in_transit" && (
                    <span style={{ fontSize: 9, color: "#2e4058" }}>ETA {truck.eta}</span>
                  )}
                </div>
              </div>
            );
          })}
        </aside>

        {/* MAP */}
        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {/* Selected truck detail panel */}
          {selectedTruckData && (
            <div style={{
              position: "absolute", bottom: 20, left: 20,
              background: "#0a0f16ee", border: "1px solid #1e2a38",
              borderLeft: `3px solid ${STATUS_META[selectedTruckData.status].dot}`,
              padding: "14px 18px", borderRadius: 6,
              minWidth: 220, backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#cdd9e5", marginBottom: 6 }}>
                {selectedTruckData.label}
              </div>
              {([
                ["Driver",   selectedTruckData.driver],
                ["Cargo",    selectedTruckData.cargo],
                ["Status",   STATUS_META[selectedTruckData.status].label],
                ["Progress", `${selectedTruckData.progressPct}%`],
                ["Speed",    `${selectedTruckData.speed} km/h`],
                ["Route",    `${cityForRoute(selectedTruckData.routeId, "from")} → ${cityForRoute(selectedTruckData.routeId, "to")}`],
              ] as [string,string][]).map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                  <span style={{ color: "#2e4058", textTransform: "uppercase", letterSpacing: 1 }}>{k}</span>
                  <span style={{ color: STATUS_META[selectedTruckData.status].dot }}>{v}</span>
                </div>
              ))}
              <button onClick={() => setSelectedTruck(null)} style={{
                marginTop: 10, width: "100%", padding: "4px 0",
                background: "transparent", border: "1px solid #1e2a38",
                color: "#4a6080", cursor: "pointer", fontSize: 10,
                borderRadius: 3, letterSpacing: 1,
              }}>CLOSE</button>
            </div>
          )}

          {/* Legend */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: "#0a0f16cc", border: "1px solid #1e2a38",
            padding: "10px 14px", borderRadius: 5, backdropFilter: "blur(6px)",
          }}>
            {[
              { shape: "circle", color: "#4ade80", label: "Collection" },
              { shape: "square", color: "#f97316", label: "Shed" },
            ].map(({ shape, color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                <div style={{
                  width: 10, height: 10,
                  borderRadius: shape === "circle" ? "50%" : 2,
                  background: color,
                }} />
                <span style={{ fontSize: 10, color: "#4a6080", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #1e2a38", marginTop: 6, paddingTop: 6 }}>
              <div style={{ fontSize: 9, color: "#1e2a38", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>Routes</div>
              {ROUTES.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 18, height: 3, borderRadius: 2, background: ROUTE_COLORS[r.id] ?? "#fff" }} />
                  <span style={{ fontSize: 9, color: "#4a6080", textTransform: "uppercase", letterSpacing: 1 }}>
                    {cityForRoute(r.id, "from")} → {cityForRoute(r.id, "to")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}