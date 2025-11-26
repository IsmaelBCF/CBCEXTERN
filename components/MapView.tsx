import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoLocation, MapMarker } from '../types';

// Fix for default Leaflet marker icons in React
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to generate icons based on color
const getMarkerIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

interface MapViewProps {
  markers: MapMarker[];
  center: GeoLocation;
  routeHistory?: GeoLocation[];
  className?: string;
}

const Recenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
};

const MapView: React.FC<MapViewProps> = ({ markers, center, routeHistory, className }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className={`bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 ${className}`}>Carregando Mapa...</div>;

  return (
    <div className={`overflow-hidden rounded-xl shadow-sm z-0 relative ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter lat={center.lat} lng={center.lng} />
        
        {/* Route History Polyline */}
        {routeHistory && routeHistory.length > 1 && (
          <Polyline 
            positions={routeHistory.map(h => [h.lat, h.lng])}
            color="#3b82f6"
            weight={4}
            opacity={0.7}
            dashArray="8, 8"
          />
        )}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={getMarkerIcon(marker.color)}
            opacity={marker.isCompleted ? 0.6 : 1.0}
          >
            <Popup>
              <div className="text-center">
                <strong className="block text-sm mb-1 text-slate-800">{marker.title}</strong>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full text-white font-bold bg-${marker.color === 'gold' ? 'yellow-500' : marker.color === 'violet' ? 'purple-600' : marker.color + '-600'}`}>
                    {marker.type}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Current User location marker if distinct */}
        <Marker position={[center.lat, center.lng]} icon={getMarkerIcon('red')}>
           <Popup>Localização Selecionada</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapView;