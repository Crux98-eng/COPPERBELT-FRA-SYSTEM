import { MapContainer, TileLayer, Polygon } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const farmCoordinates = [
  [-12.345, 28.456],
  [-12.346, 28.457],
  [-12.347, 28.455],
  [-12.346, 28.454],
];
const farmCenter = [-12.346, 28.456];
export default function FarmMap() {
    
  return (
    <MapContainer center={farmCenter} zoom={16} style={{ height: "300px" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Polygon positions={farmCoordinates} />
    </MapContainer>
  );
}