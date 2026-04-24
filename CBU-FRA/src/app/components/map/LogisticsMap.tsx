// import { useEffect, useRef, useState } from "react";
// import maplibregl from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// type LocationType = "collection" | "shed";
// type LngLat = [number, number];

// interface Location {
//   name: string;
//   type: LocationType;
//   coordinates: { lat: number; lng: number };
// }

// interface Route {
//   id: number;
//   from: string;
//   to: string;
// }

// interface Region {
//   id: string;
//   name: string;
//   polygon: LngLat[];
// }

// interface TruckState {
//   id: string;
//   routeId: number;
//   progress: number;
// }

// interface TruckMarkerState extends TruckState {
//   marker: maplibregl.Marker;
//   alerted: boolean;
// }

// const locations: Location[] = [
//   {
//     name: "Lusaka Collection Center",
//     type: "collection",
//     coordinates: { lat: -15.4167, lng: 28.2833 },
//   },
//   {
//     name: "Chipata Collection Center",
//     type: "collection",
//     coordinates: { lat: -13.6334, lng: 32.6503 },
//   },
//   {
//     name: "Mongu Collection Center",
//     type: "collection",
//     coordinates: { lat: -15.2694, lng: 23.1459 },
//   },
//   {
//     name: "Lusaka North Shed",
//     type: "shed",
//     coordinates: { lat: -15.3875, lng: 28.3228 },
//   },
//   {
//     name: "Chipata Central Shed",
//     type: "shed",
//     coordinates: { lat: -13.6543, lng: 32.6234 },
//   },
// ];

// const routes: Route[] = [
//   {
//     id: 1,
//     from: "Lusaka Collection Center",
//     to: "Lusaka North Shed",
//   },
//   {
//     id: 2,
//     from: "Chipata Collection Center",
//     to: "Chipata Central Shed",
//   },
//   {
//     id: 3,
//     from: "Mongu Collection Center",
//     to: "Lusaka North Shed",
//   },
// ];

// const regions: Region[] = [
//   {
//     id: "REGION_LSK",
//     name: "Lusaka Region",
//     polygon: [
//       [28.0, -15.6],
//       [28.6, -15.6],
//       [28.6, -15.2],
//       [28.0, -15.2],
//       [28.0, -15.6],
//     ],
//   },
// ];

// const interpolate = (start: LngLat, end: LngLat, t: number): LngLat => [
//   start[0] + (end[0] - start[0]) * t,
//   start[1] + (end[1] - start[1]) * t,
// ];

// const isPointInPolygon = (point: LngLat, polygon: LngLat[]) => {
//   const [x, y] = point;
//   let inside = false;

//   for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
//     const [xi, yi] = polygon[i];
//     const [xj, yj] = polygon[j];
//     const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
//     if (intersects) inside = !inside;
//   }

//   return inside;
// };

// export function LogisticsMap() {
//   const mapRef = useRef<HTMLDivElement | null>(null);
//   const mapInstanceRef = useRef<maplibregl.Map | null>(null);
//   const intervalRef = useRef<number | null>(null);
//   const selectedShedRef = useRef("all");

//   const [selectedShed, setSelectedShed] = useState("all");

//   const trucksRef = useRef<TruckState[]>([
//     { id: "T1", routeId: 1, progress: 0 },
//     { id: "T2", routeId: 2, progress: 0.3 },
//     { id: "T3", routeId: 3, progress: 0.6 },
//   ]);

//   useEffect(() => {
//     selectedShedRef.current = selectedShed;
//   }, [selectedShed]);

//   useEffect(() => {
//     if (!mapRef.current || mapInstanceRef.current) return;

//     const map = new maplibregl.Map({
//       container: mapRef.current,
//       style: "https://demotiles.maplibre.org/style.json",
//       center: [28.2833, -15.4167],
//       zoom: 5,
//     });

//     mapInstanceRef.current = map;

//     map.on("load", () => {
//       locations.forEach((location) => {
//         new maplibregl.Marker({
//           color: location.type === "collection" ? "green" : "orange",
//         })
//           .setLngLat([location.coordinates.lng, location.coordinates.lat])
//           .setPopup(new maplibregl.Popup().setText(location.name))
//           .addTo(map);
//       });

//       routes.forEach((route) => {
//         const from = locations.find((location) => location.name === route.from);
//         const to = locations.find((location) => location.name === route.to);
//         if (!from || !to) return;

//         map.addSource(`route-${route.id}`, {
//           type: "geojson",
//           data: {
//             type: "Feature",
//             geometry: {
//               type: "LineString",
//               coordinates: [
//                 [from.coordinates.lng, from.coordinates.lat],
//                 [to.coordinates.lng, to.coordinates.lat],
//               ],
//             },
//             properties: {},
//           },
//         });

//         map.addLayer({
//           id: `route-${route.id}`,
//           type: "line",
//           source: `route-${route.id}`,
//           paint: {
//             "line-color": "#1B5E20",
//             "line-width": 3,
//             "line-dasharray": [2, 2],
//           },
//         });
//       });

//       regions.forEach((region) => {
//         map.addSource(region.id, {
//           type: "geojson",
//           data: {
//             type: "Feature",
//             geometry: {
//               type: "Polygon",
//               coordinates: [region.polygon],
//             },
//             properties: {},
//           },
//         });

//         map.addLayer({
//           id: region.id,
//           type: "fill",
//           source: region.id,
//           paint: {
//             "fill-color": "#4CAF50",
//             "fill-opacity": 0.2,
//           },
//         });
//       });

//       const truckMarkers: TruckMarkerState[] = trucksRef.current.map((truck) => ({
//         ...truck,
//         marker: new maplibregl.Marker({ color: "blue" }).addTo(map),
//         alerted: false,
//       }));

//       intervalRef.current = window.setInterval(() => {
//         truckMarkers.forEach((truck) => {
//           const route = routes.find((item) => item.id === truck.routeId);
//           if (!route) return;

//           const from = locations.find((location) => location.name === route.from);
//           const to = locations.find((location) => location.name === route.to);
//           if (!from || !to) return;

//           if (selectedShedRef.current !== "all" && route.to !== selectedShedRef.current) {
//             truck.marker.getElement().style.display = "none";
//             return;
//           }

//           truck.marker.getElement().style.display = "block";
//           truck.progress += 0.002;
//           if (truck.progress > 1) truck.progress = 1;

//           const [lng, lat] = interpolate(
//             [from.coordinates.lng, from.coordinates.lat],
//             [to.coordinates.lng, to.coordinates.lat],
//             truck.progress
//           );

//           truck.marker.setLngLat([lng, lat]);

//           if (truck.progress >= 1 && !truck.alerted) {
//             window.alert(`${truck.id} has arrived at ${route.to}`);
//             truck.alerted = true;
//           }

//           regions.forEach((region) => {
//             if (isPointInPolygon([lng, lat], region.polygon)) {
//               console.log(`${truck.id} is inside ${region.name}`);
//             }
//           });
//         });
//       }, 100);
//     });

//     return () => {
//       if (intervalRef.current !== null) {
//         window.clearInterval(intervalRef.current);
//         intervalRef.current = null;
//       }

//       map.remove();
//       mapInstanceRef.current = null;
//     };
//   }, []);

//   return (
//     <div className="p-4">
//       <div className="mb-4">
//         <select
//           value={selectedShed}
//           onChange={(event) => setSelectedShed(event.target.value)}
//           className="border px-3 py-2 rounded"
//         >
//           <option value="all">All Destinations</option>
//           <option value="Lusaka North Shed">Lusaka Shed</option>
//           <option value="Chipata Central Shed">Chipata Shed</option>
//         </select>
//       </div>

//       <div ref={mapRef} className="h-[600px] w-full rounded-lg" />
//     </div>
//   );
// }

// export default LogisticsMap;
// import { useEffect, useRef, useState } from "react";
// import maplibregl, { Map, Marker, LngLatBounds } from "maplibre-gl";
// import "maplibre-gl/dist/maplibre-gl.css";

// type LocationType = "collection" | "shed";
// type LngLat = [number, number];

// interface Location {
//   name: string;
//   type: LocationType;
//   coordinates: { lat: number; lng: number };
// }

// interface Route {
//   id: number;
//   from: string;
//   to: string;
// }

// interface Truck {
//   id: string;
//   routeId: number;
//   progress: number;
//   marker?: Marker;
//   alerted?: boolean;
// }

// // ================= DATA =================
// const locations: Location[] = [
//   { name: "Lusaka Collection Center", type: "collection", coordinates: { lat: -15.4167, lng: 28.2833 } },
//   { name: "Chipata Collection Center", type: "collection", coordinates: { lat: -13.6334, lng: 32.6503 } },
//   { name: "Mongu Collection Center", type: "collection", coordinates: { lat: -15.2694, lng: 23.1459 } },
//   { name: "Lusaka North Shed", type: "shed", coordinates: { lat: -15.3875, lng: 28.3228 } },
//   { name: "Chipata Central Shed", type: "shed", coordinates: { lat: -13.6543, lng: 32.6234 } },
// ];

// const routes: Route[] = [
//   { id: 1, from: "Lusaka Collection Center", to: "Lusaka North Shed" },
//   { id: 2, from: "Chipata Collection Center", to: "Chipata Central Shed" },
//   { id: 3, from: "Mongu Collection Center", to: "Lusaka North Shed" },
// ];

// // ================= HELPERS =================
// const createCurvedLine = (from: LngLat, to: LngLat): LngLat[] => {
//   const midLng = (from[0] + to[0]) / 2;
//   const midLat = (from[1] + to[1]) / 2 + 1;
//   return [from, [midLng, midLat], to];
// };

// const interpolate = (start: LngLat, end: LngLat, t: number): LngLat => [
//   start[0] + (end[0] - start[0]) * t,
//   start[1] + (end[1] - start[1]) * t,
// ];

// // ================= COMPONENT =================
// export default function LogisticsMap() {
//   const mapRef = useRef<HTMLDivElement | null>(null);
//   const mapInstance = useRef<Map | null>(null);
//   const intervalRef = useRef<number | null>(null);

//   const [selectedShed, setSelectedShed] = useState<string>("all");

//   const trucksRef = useRef<Truck[]>([
//     { id: "T1", routeId: 1, progress: 0 },
//     { id: "T2", routeId: 2, progress: 0.3 },
//     { id: "T3", routeId: 3, progress: 0.6 },
//   ]);

//   // ================= INIT MAP =================
//   useEffect(() => {
//     if (!mapRef.current || mapInstance.current) return;

//     const map = new maplibregl.Map({
//       container: mapRef.current,
//       style: "https://demotiles.maplibre.org/style.json",
//       center: [28.2833, -15.4167],
//       zoom: 5,
//     });

//     mapInstance.current = map;

//     // controls
//     map.addControl(new maplibregl.NavigationControl(), "top-right");
//     map.scrollZoom.enable();
//     map.dragPan.enable();
//     map.touchZoomRotate.enable();

//     map.on("load", () => {
//       // markers
//       locations.forEach((loc) => {
//         new maplibregl.Marker({
//           color: loc.type === "collection" ? "green" : "orange",
//         })
//           .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
//           .setPopup(new maplibregl.Popup().setText(loc.name))
//           .addTo(map);
//       });

//       // routes
//       routes.forEach((route) => {
//         const from = locations.find((l) => l.name === route.from);
//         const to = locations.find((l) => l.name === route.to);
//         if (!from || !to) return;

//         const coords = createCurvedLine(
//           [from.coordinates.lng, from.coordinates.lat],
//           [to.coordinates.lng, to.coordinates.lat]
//         );

//         map.addSource(`route-${route.id}`, {
//           type: "geojson",
//           data: {
//             type: "Feature",
//             geometry: { type: "LineString", coordinates: coords },
//             properties: {},
//           },
//         });

//         map.addLayer({
//           id: `route-${route.id}`,
//           type: "line",
//           source: `route-${route.id}`,
//           paint: {
//             "line-color": "#1B5E20",
//             "line-width": 3,
//             "line-dasharray": [2, 2],
//           },
//         });
//       });

//       // trucks
//       trucksRef.current.forEach((truck) => {
//         truck.marker = new maplibregl.Marker({ color: "blue" }).addTo(map);
//         truck.alerted = false;
//       });

//       // animation
//       intervalRef.current = window.setInterval(() => {
//         trucksRef.current.forEach((truck) => {
//           const route = routes.find((r) => r.id === truck.routeId);
//           if (!route) return;

//           const from = locations.find((l) => l.name === route.from);
//           const to = locations.find((l) => l.name === route.to);
//           if (!from || !to || !truck.marker) return;

//           if (selectedShed !== "all" && route.to !== selectedShed) {
//             truck.marker.getElement().style.display = "none";
//             return;
//           }

//           truck.marker.getElement().style.display = "block";

//           truck.progress += 0.002;
//           if (truck.progress > 1) truck.progress = 1;

//           const [lng, lat] = interpolate(
//             [from.coordinates.lng, from.coordinates.lat],
//             [to.coordinates.lng, to.coordinates.lat],
//             truck.progress
//           );

//           truck.marker.setLngLat([lng, lat]);

//           if (truck.progress >= 1 && !truck.alerted) {
//             alert(`${truck.id} reached ${route.to}`);
//             truck.alerted = true;
//           }
//         });
//       }, 100);

//       // fit bounds
//       const bounds = new LngLatBounds();
//       locations.forEach((loc) =>
//         bounds.extend([loc.coordinates.lng, loc.coordinates.lat])
//       );
//       map.fitBounds(bounds, { padding: 50 });
//     });

//     return () => {
//       if (intervalRef.current) clearInterval(intervalRef.current);
//       map.remove();
//       mapInstance.current = null;
//     };
//   }, []);

//   // ================= FILTER ZOOM =================
//   useEffect(() => {
//     const map = mapInstance.current;
//     if (!map) return;

//     const bounds = new LngLatBounds();

//     routes.forEach((route) => {
//       if (selectedShed !== "all" && route.to !== selectedShed) return;

//       const from = locations.find((l) => l.name === route.from);
//       const to = locations.find((l) => l.name === route.to);

//       if (!from || !to) return;

//       bounds.extend([from.coordinates.lng, from.coordinates.lat]);
//       bounds.extend([to.coordinates.lng, to.coordinates.lat]);
//     });

//     if (!bounds.isEmpty()) {
//       map.fitBounds(bounds, { padding: 80, duration: 800 });
//     }
//   }, [selectedShed]);

//   return (
//     <div className="p-4">
//       <div className="mb-4">
//         <select
//           value={selectedShed}
//           onChange={(e) => setSelectedShed(e.target.value)}
//           className="border px-3 py-2 rounded"
//         >
//           <option value="all">All Destinations</option>
//           <option value="Lusaka North Shed">Lusaka Shed</option>
//           <option value="Chipata Central Shed">Chipata Shed</option>
//         </select>
//       </div>

//       <div ref={mapRef} className="h-[600px] w-full rounded-lg" />
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import maplibregl, { Map, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type LngLat = [number, number];

interface Location {
  name: string;
  type: "collection" | "shed";
  coordinates: { lat: number; lng: number };
}

interface Route {
  id: number;
  from: string;
  to: string;
}

interface Truck {
  id: string;
  routeId: number;
  position: LngLat;
  speed: number; // km/h
  status: "moving" | "arrived";
  marker?: Marker;
}

// ================= DATA =================
const locations: Location[] = [
  { name: "Lusaka Collection Center", type: "collection", coordinates: { lat: -15.4167, lng: 28.2833 } },
  { name: "Chipata Collection Center", type: "collection", coordinates: { lat: -13.6334, lng: 32.6503 } },
  { name: "Mongu Collection Center", type: "collection", coordinates: { lat: -15.2694, lng: 23.1459 } },
  { name: "Lusaka North Shed", type: "shed", coordinates: { lat: -15.3875, lng: 28.3228 } },
  { name: "Chipata Central Shed", type: "shed", coordinates: { lat: -13.6543, lng: 32.6234 } },
];

const routes: Route[] = [
  { id: 1, from: "Lusaka Collection Center", to: "Lusaka North Shed" },
  { id: 2, from: "Chipata Collection Center", to: "Chipata Central Shed" },
  { id: 3, from: "Mongu Collection Center", to: "Lusaka North Shed" },
];

// ================= HELPERS =================
const getRoutePoints = (route: Route): [LngLat, LngLat] | null => {
  const from = locations.find(l => l.name === route.from);
  const to = locations.find(l => l.name === route.to);
  if (!from || !to) return null;

  return [
    [from.coordinates.lng, from.coordinates.lat],
    [to.coordinates.lng, to.coordinates.lat],
  ];
};

const moveTowards = (current: LngLat, target: LngLat, speed: number): LngLat => {
  const dx = target[0] - current[0];
  const dy = target[1] - current[1];

  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 0.0001) return target;

  const step = speed * 0.00001; // simulation scaling

  return [
    current[0] + (dx / distance) * step,
    current[1] + (dy / distance) * step,
  ];
};

// ================= COMPONENT =================
export default function LogisticsMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<Map | null>(null);
  const intervalRef = useRef<number | null>(null);

  const [selectedShed, setSelectedShed] = useState("all");

  // 🔥 REALISTIC TRUCK STATE
  const trucksRef = useRef<Truck[]>([
    {
      id: "T1",
      routeId: 1,
      position: [28.2833, -15.4167],
      speed: 60,
      status: "moving",
    },
    {
      id: "T2",
      routeId: 2,
      position: [32.6503, -13.6334],
      speed: 50,
      status: "moving",
    },
  ]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [28, -15],
      zoom: 5,
    });

    mapInstance.current = map;
    map.addControl(new maplibregl.NavigationControl());

    map.on("load", () => {
      // markers
      locations.forEach((loc) => {
        new maplibregl.Marker({
          color: loc.type === "collection" ? "green" : "orange",
        })
          .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
          .addTo(map);
      });

      // trucks
      trucksRef.current.forEach((truck) => {
        truck.marker = new maplibregl.Marker({ color: "blue" }).addTo(map);
      });

      // 🔁 SIMULATION LOOP (like backend stream)
      intervalRef.current = window.setInterval(() => {
        trucksRef.current.forEach((truck) => {
          if (truck.status === "arrived") return;

          const route = routes.find(r => r.id === truck.routeId);
          if (!route) return;

          const points = getRoutePoints(route);
          if (!points) return;

          const [_, target] = points;

          // 🚛 move using GPS logic
          truck.position = moveTowards(truck.position, target, truck.speed);

          truck.marker?.setLngLat(truck.position);

          // 🚨 arrival detection
          const dx = truck.position[0] - target[0];
          const dy = truck.position[1] - target[1];

          if (Math.sqrt(dx * dx + dy * dy) < 0.001) {
            truck.status = "arrived";
            console.log(`${truck.id} arrived at ${route.to}`);
          }
        });
      }, 100);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      map.remove();
    };
  }, []);

  return (
    <div className="p-4">
      <select
        value={selectedShed}
        onChange={(e) => setSelectedShed(e.target.value)}
        className="mb-4 border px-3 py-2 rounded"
      >
        <option value="all">All</option>
        <option value="Lusaka North Shed">Lusaka</option>
        <option value="Chipata Central Shed">Chipata</option>
      </select>

      <div ref={mapRef} className="h-[600px] w-full rounded-lg" />
    </div>
  );
}