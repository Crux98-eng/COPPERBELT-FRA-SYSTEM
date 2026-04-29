import { useMemo, useRef } from "react";
import Map, {
  Layer,
  Marker,
  Source,
  type LayerProps,
  type MapRef,
} from "@vis.gl/react-maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export type LatLng = [number, number];
type LngLat = [number, number];
export type FarmCoordinateInput = LatLng | { lat: number; lng: number };

const MIN_POLYGON_POINTS = 4;
const MAX_POLYGON_POINTS = 20;

const fallbackCoordinates: LatLng[] = [
  [-12.345, 28.456],
  [-12.346, 28.457],
  [-12.347, 28.455],
  [-12.346, 28.454],
];

const mapStyleUrl = "https://demotiles.maplibre.org/style.json";
 
const farmFillLayer: LayerProps = {
  id: "farm-area-fill",
  type: "fill",
  paint: {
    "fill-color": "#2E7D32",
    "fill-opacity": 0.3,
  },
};

const farmOutlineLayer: LayerProps = {
  id: "farm-area-outline",
  type: "line",
  paint: {
    "line-color": "#1B5E20",
    "line-width": 3,
    "line-opacity": 0.9,
  },
};

interface FarmMapProps {
  coordinates?: FarmCoordinateInput[];
  className?: string;
}

const isValidLatitude = (value: number) => value >= -90 && value <= 90;
const isValidLongitude = (value: number) => value >= -180 && value <= 180;
const isSameCoordinate = (a: LatLng, b: LatLng) => a[0] === b[0] && a[1] === b[1];

const toLatLng = (value: FarmCoordinateInput): LatLng | null => {
  if (Array.isArray(value) && value.length === 2) {
    const [lat, lng] = value;
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      isValidLatitude(lat) &&
      isValidLongitude(lng)
    ) {
      return [lat, lng];
    }

    return null;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "lat" in value &&
    "lng" in value
  ) {
    const lat = (value as { lat: unknown }).lat;
    const lng = (value as { lng: unknown }).lng;
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      isValidLatitude(lat as number) &&
      isValidLongitude(lng as number)
    ) {
      return [lat as number, lng as number];
    }
  }

  return null;
};

const FarmMap = ({ coordinates = fallbackCoordinates, className }: FarmMapProps) => {
  const mapRef = useRef<MapRef | null>(null);

  const normalizedCoordinates = useMemo(() => {
    return coordinates.map(toLatLng);
  }, [coordinates]);

  const hasInvalidCoordinates = normalizedCoordinates.some((value) => value === null);

  const validCoordinates = useMemo<LatLng[]>(() => {
    return normalizedCoordinates.filter((value): value is LatLng => value !== null);
  }, [normalizedCoordinates]);

  const inputCoordinates = useMemo<LatLng[]>(() => {
    if (validCoordinates.length < 2) {
      return validCoordinates;
    }

    const first = validCoordinates[0];
    const last = validCoordinates[validCoordinates.length - 1];
    return isSameCoordinate(first, last) ? validCoordinates.slice(0, -1) : validCoordinates;
  }, [validCoordinates]);

  const pointCount = inputCoordinates.length;
  const isPointCountValid =
    pointCount >= MIN_POLYGON_POINTS && pointCount <= MAX_POLYGON_POINTS;

  const lngLatPoints = useMemo<LngLat[]>(() => {
    return inputCoordinates.map(([lat, lng]) => [lng, lat]);
  }, [inputCoordinates]);

  const polygonRing = useMemo<LngLat[]>(() => {
    if (!isPointCountValid || hasInvalidCoordinates) {
      return [];
    }

    const ring = [...lngLatPoints];
    const first = ring[0];
    const last = ring[ring.length - 1];
    const isClosed = first[0] === last[0] && first[1] === last[1];

    return isClosed ? ring : [...ring, first];
  }, [hasInvalidCoordinates, isPointCountValid, lngLatPoints]);


  const polygonGeoJson = useMemo<GeoJSON.Feature<GeoJSON.Polygon>>(() => {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [polygonRing],
      },
    };
  }, [polygonRing]);

  const bounds = useMemo(() => {
    if (polygonRing.length < MIN_POLYGON_POINTS + 1) {
      return null;
    }

    const points = polygonRing.slice(0, -1);
    let minLng = points[0][0];
    let maxLng = points[0][0];
    let minLat = points[0][1];
    let maxLat = points[0][1];

    for (const [lng, lat] of points) {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    if (minLng === maxLng) {
      minLng -= 0.001;
      maxLng += 0.001;
    }

    if (minLat === maxLat) {
      minLat -= 0.001;
      maxLat += 0.001;
    }

    return [
      [minLng, minLat] as [number, number],
      [maxLng, maxLat] as [number, number],
    ] as [[number, number], [number, number]];
  }, [polygonRing]);

  const mapCenter = useMemo(() => {
    if (!bounds) {
      return null;
    }

    return {
      longitude: (bounds[0][0] + bounds[1][0]) / 2,
      latitude: (bounds[0][1] + bounds[1][1]) / 2,
    };
  }, [bounds]);

  const containerClassName = [
    "w-full h-80 rounded-lg overflow-hidden border border-border",
    className ?? "",
  ]
    .join(" ")
    .trim();

  if (hasInvalidCoordinates) {
    return (
      <div className="w-full h-80 rounded-lg border border-border bg-muted/30 flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Invalid coordinate format. Use <code className="font-mono">[lat, lng]</code>{" "}
          or <code className="font-mono">{"{ lat, lng }"}</code>.
        </p>
      </div>
    );
  }

  if (!isPointCountValid) {
    return (
      <div className="w-full h-80 rounded-lg border border-border bg-muted/30 flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Farm polygon requires {MIN_POLYGON_POINTS}-{MAX_POLYGON_POINTS} coordinates.
          Received {pointCount}.
        </p>
      </div>
    );
  }

  if (!mapCenter) {
    return (
      <div className="w-full h-80 rounded-lg border border-border bg-muted/30 flex items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Invalid farm boundary data. Please check coordinate values.
        </p>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{
          longitude: mapCenter.longitude,
          latitude: mapCenter.latitude,
          zoom: 14,
        }}
        mapStyle={mapStyleUrl}
        style={{ width: "100%", height: "100%" }}
        onLoad={() => {
          mapRef.current?.fitBounds(bounds, {
            padding: 40,
            duration: 0,
          });
        }}
      >
        <Source id="farm-area-source" type="geojson" data={polygonGeoJson}>
          <Layer {...farmFillLayer} />
          <Layer {...farmOutlineLayer} />
        </Source>

        <Marker
          longitude={mapCenter.longitude}
          latitude={mapCenter.latitude}
          anchor="center"
        >
          <div className="w-3 h-3 rounded-full bg-primary border-2 border-white shadow" />
        </Marker>
      </Map>
    </div>
  );
};

export default FarmMap;
