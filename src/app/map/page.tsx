'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapPin, User, ExternalLink, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import type * as Leaflet from 'leaflet';
import Navbar from '@/components/layout/Navbar';
import SearchCommand from '@/components/search/SearchCommand';
import { createClient } from '@/lib/supabase/client';
import { cn, getInitials, getGoogleMapsDirectionsUrl } from '@/lib/utils';
import type { Family, FamilyMember } from '@/types';

export default function MapPage() {
  const supabase = createClient();
  const [families, setFamilies] = useState<Family[]>([]);
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Leaflet.Map | null>(null);
  const markersRef = useRef<Leaflet.LayerGroup | null>(null);

  // Indonesia center
  const defaultCenter: [number, number] = [-2.5, 118];

  useEffect(() => {
    const fetchFamilies = async () => {
      const { data } = await supabase.from('families').select('*').order('name');
      if (data) {
        setFamilies(data as Family[]);
        if (data.length > 0) setCurrentFamily(data[0] as Family);
      }
    };
    fetchFamilies();
  }, [supabase]);

  useEffect(() => {
    if (!currentFamily) return;
    const fetchMembers = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', currentFamily.id)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (data) setMembers(data as FamilyMember[]);
      setIsLoading(false);
    };
    fetchMembers();
  }, [currentFamily, supabase]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: 5,
        zoomControl: true,
        attributionControl: false,
      });

      // Dark tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Attribution in a subtle way
      L.control.attribution({ position: 'bottomright', prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:#64748b">OpenStreetMap</a> © <a href="https://carto.com/" style="color:#64748b">CARTO</a>')
        .addTo(map);

      markersRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  // Update markers when members change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersRef.current || members.length === 0) return;

    import('leaflet').then((L) => {
      // Clear existing markers
      markersRef.current!.clearLayers();

      const membersWithLocation = members.filter(
        (m) => m.latitude !== null && m.longitude !== null
      );

      membersWithLocation.forEach((member) => {
        const markerColor = member.is_alive ? '#10b981' : '#ef4444';
        const borderColor = member.is_alive ? '#059669' : '#dc2626';
        const initials = getInitials(member.full_name);

        const icon = L.divIcon({
          className: 'family-map-marker',
          html: `
            <div class="marker-container" style="position:relative; cursor:pointer;">
              <div style="
                width: 40px; height: 40px;
                background: ${markerColor};
                border: 3px solid ${borderColor};
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 2px 12px rgba(0,0,0,0.5);
                transition: transform 0.2s;
                overflow: hidden;
              ">
                ${
                  member.photo_url
                    ? `<img src="${member.photo_url}" alt="${member.full_name}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;" />`
                    : `<span style="color:#fff;font-size:11px;font-weight:700;font-family:'Plus Jakarta Sans',sans-serif;">${initials}</span>`
                }
              </div>
              <div class="marker-label" style="
                position: absolute;
                bottom: -22px; left: 50%;
                transform: translateX(-50%);
                white-space: nowrap;
                padding: 2px 8px;
                background: rgba(0,0,0,0.75);
                backdrop-filter: blur(4px);
                border-radius: 4px;
                font-size: 10px;
                color: #fff;
                font-weight: 500;
                font-family: 'Plus Jakarta Sans', sans-serif;
                opacity: 0;
                transition: opacity 0.2s;
                pointer-events: none;
              ">${member.full_name}</div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker([member.latitude!, member.longitude!], { icon });
        
        marker.on('click', () => {
          setSelectedMember(member);
        });

        // Hover effects via CSS
        marker.on('mouseover', (e) => {
          const el = e.target.getElement();
          if (el) {
            const label = el.querySelector('.marker-label') as HTMLElement;
            const circle = el.querySelector('.marker-container > div') as HTMLElement;
            if (label) label.style.opacity = '1';
            if (circle) circle.style.transform = 'scale(1.15)';
          }
        });
        marker.on('mouseout', (e) => {
          const el = e.target.getElement();
          if (el) {
            const label = el.querySelector('.marker-label') as HTMLElement;
            const circle = el.querySelector('.marker-container > div') as HTMLElement;
            if (label) label.style.opacity = '0';
            if (circle) circle.style.transform = 'scale(1)';
          }
        });

        markersRef.current!.addLayer(marker);
      });

      // Fit bounds if there are markers
      if (membersWithLocation.length > 0) {
        const bounds = L.latLngBounds(
          membersWithLocation.map((m) => [m.latitude!, m.longitude!] as [number, number])
        );
        mapInstanceRef.current!.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      }
    });
  }, [members]);

  const membersWithLocation = members.filter(
    (m) => m.latitude !== null && m.longitude !== null
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-16 relative">
        {/* Header overlay */}
        <div className="absolute top-20 left-4 z-[1000] flex flex-col gap-2">
          <div className="glass-card px-4 py-3 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-400" />
            <div>
              <h1 className="text-sm font-bold text-slate-200">Peta Persebaran Keluarga</h1>
              <p className="text-xs text-slate-400">
                {membersWithLocation.length} anggota tercatat
              </p>
            </div>
          </div>

          {/* Family selector */}
          <select
            value={currentFamily?.id || ''}
            onChange={(e) => {
              const family = families.find((f) => f.id === e.target.value);
              if (family) setCurrentFamily(family);
            }}
            className="glass-card px-3 py-2 text-sm text-slate-200 bg-transparent border-0 cursor-pointer"
          >
            {families.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-800">
                {f.name}
              </option>
            ))}
          </select>

          {/* Legend */}
          <div className="glass-card px-4 py-3 space-y-1.5">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Legenda</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-300">Masih Hidup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <span className="text-xs text-slate-300">Almarhum/ah</span>
            </div>
          </div>
        </div>

        {/* Selected member info card */}
        {selectedMember && (
          <div className="absolute top-20 right-4 z-[1000] w-72 glass-card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-200">Detail Anggota</h3>
              <button
                onClick={() => setSelectedMember(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all min-h-0 min-w-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center border-2 flex-shrink-0 overflow-hidden',
                  selectedMember.gender === 'male'
                    ? 'bg-indigo-500/15 border-indigo-500/30'
                    : 'bg-pink-500/15 border-pink-500/30'
                )}
              >
                {selectedMember.photo_url ? (
                  <img
                    src={selectedMember.photo_url}
                    alt={selectedMember.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      'text-sm font-bold',
                      selectedMember.gender === 'male' ? 'text-indigo-300' : 'text-pink-300'
                    )}
                  >
                    {getInitials(selectedMember.full_name)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-200">{selectedMember.full_name}</p>
                <p className="text-xs text-slate-400">Generasi {selectedMember.generation}</p>
              </div>
            </div>

            {selectedMember.address && (
              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{selectedMember.address}</p>
            )}

            <div className="flex gap-2">
              <Link
                href="/tree"
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/25 transition-colors"
              >
                <User className="w-3 h-3" />
                Lihat Profil
              </Link>
              {selectedMember.latitude && selectedMember.longitude && (
                <a
                  href={getGoogleMapsDirectionsUrl(selectedMember.latitude, selectedMember.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/15 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/25 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Navigasi
                </a>
              )}
            </div>
          </div>
        )}

        {/* Map */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-[var(--color-bg-primary)]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-3" />
              <p className="text-slate-400">Memuat peta...</p>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" style={{ zIndex: 0 }} />
        )}
      </main>

      <SearchCommand />
    </div>
  );
}
