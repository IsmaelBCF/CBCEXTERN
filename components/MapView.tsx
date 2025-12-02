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

const FitBoundsControl = ({ markers, routeHistory, center }: { markers: MapMarker[], routeHistory?: GeoLocation[], center: GeoLocation }) => {
  const map = useMap();

  const fitBounds = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const bounds = L.latLngBounds([]);
    
    // Add current center
    bounds.extend([center.lat, center.lng]);

    // Add markers
    if (markers.length > 0) {
        markers.forEach(marker => bounds.extend([marker.lat, marker.lng]));
    }

    // Add route
    if (routeHistory && routeHistory.length > 0) {
      routeHistory.forEach(point => bounds.extend([point.lat, point.lng]));
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <div className="leaflet-top leaflet-right">
       <div className="leaflet-control leaflet-bar">
          <a
            href="#"
            title="Ajustar visualização (Ver tudo)"
            role="button"
            aria-label="Ajustar visualização"
            onClick={fitBounds}
            className="flex items-center justify-center bg-white text-slate-700 hover:bg-slate-50 w-[30px] h-[30px]"
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
             </svg>
          </a>
       </div>
    </div>
  );
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

        <FitBoundsControl markers={markers} routeHistory={routeHistory} center={center} />
      </MapContainer>
    </div>
  );
};

export default MapView;