'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Loader2, CheckCircle2, MapPin, AlertCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface AddressGeocoderProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  onAddressChange: (address: string) => void;
  onCoordsChange: (lat: number | null, lng: number | null) => void;
}

export default function AddressGeocoder({
  address,
  latitude,
  longitude,
  onAddressChange,
  onCoordsChange,
}: AddressGeocoderProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const handleGeocode = useCallback(async () => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setGeocodeStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: address.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        onCoordsChange(data.lat, data.lng);
        if (data.formattedAddress) {
          onAddressChange(data.formattedAddress);
        }
        setGeocodeStatus('success');
      } else {
        setGeocodeStatus('error');
        setErrorMessage(data.error || 'Gagal menemukan lokasi');
        onCoordsChange(null, null);
      }
    } catch {
      setGeocodeStatus('error');
      setErrorMessage('Terjadi kesalahan jaringan');
      onCoordsChange(null, null);
    } finally {
      setIsGeocoding(false);
    }
  }, [address, onCoordsChange, onAddressChange]);

  const hasCoords = latitude !== null && longitude !== null;

  // Leaflet map for preview
  useEffect(() => {
    if (!hasCoords || !mapRef.current) return;

    // Cleanup previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [latitude!, longitude!],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 24px; height: 24px;
          background: #10b981;
          border: 3px solid #059669;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    markerRef.current = L.marker([latitude!, longitude!], { icon: markerIcon }).addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [hasCoords, latitude, longitude]);

  return (
    <div className="space-y-4">
      {/* Address input + geocode button */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Alamat Lengkap</label>
        <div className="flex gap-2">
          <input
            value={address}
            onChange={(e) => {
              onAddressChange(e.target.value);
              setGeocodeStatus('idle');
            }}
            placeholder="Masukkan alamat lengkap..."
            className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
          />
          <button
            type="button"
            onClick={handleGeocode}
            disabled={isGeocoding || !address.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {isGeocoding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Cari Lokasi
          </button>
        </div>

        {/* Status message */}
        {geocodeStatus === 'success' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-emerald-400 animate-fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Lokasi berhasil ditemukan
          </div>
        )}
        {geocodeStatus === 'error' && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400 animate-fade-in">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMessage}
          </div>
        )}
      </div>

      {/* Coordinates display */}
      {hasCoords && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={latitude || ''}
              onChange={(e) => onCoordsChange(Number(e.target.value), longitude)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={longitude || ''}
              onChange={(e) => onCoordsChange(latitude, Number(e.target.value))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 font-mono"
            />
          </div>
        </div>
      )}

      {/* Map preview */}
      {hasCoords && (
        <div className="rounded-xl overflow-hidden border border-white/10 animate-fade-in">
          <div ref={mapRef} className="h-[180px]" style={{ zIndex: 0 }} />
          <div className="px-3 py-2 bg-emerald-500/5 border-t border-white/5">
            <p className="text-xs text-emerald-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Lokasi akan ditampilkan pada peta persebaran keluarga
            </p>
          </div>
        </div>
      )}

      {!hasCoords && (
        <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
          <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            Masukkan alamat lalu tekan &quot;Cari Lokasi&quot; untuk menampilkan peta
          </p>
        </div>
      )}
    </div>
  );
}
