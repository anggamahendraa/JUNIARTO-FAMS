'use client';

import { useEffect, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { getGoogleMapsDirectionsUrl } from '@/lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  label?: string;
  isAlive?: boolean;
}

export default function ProfileMiniMap({ latitude, longitude, label, isAlive = true }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    // Dark tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker
    const markerColor = isAlive ? '#10b981' : '#ef4444';
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px; height: 24px;
          background: ${markerColor};
          border: 3px solid ${isAlive ? '#059669' : '#dc2626'};
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker([latitude, longitude], { icon: markerIcon })
      .addTo(map)
      .bindPopup(label || '');

    mapInstanceRef.current = map;

    // Fix tile rendering after mount
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [latitude, longitude, label, isAlive]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="h-[200px] w-full" style={{ zIndex: 0 }} />

      {/* Open in Google Maps button */}
      <a
        href={getGoogleMapsDirectionsUrl(latitude, longitude)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg border border-white/10 hover:bg-black/80 transition-all z-10"
      >
        <ExternalLink className="w-3 h-3" />
        Buka di Google Maps
      </a>
    </div>
  );
}
