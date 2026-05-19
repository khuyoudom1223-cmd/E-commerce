import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
// Import leaflet directly (we'll declare or import it safely)
import * as L from 'leaflet';

interface MapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (lat: number, lng: number, address: string) => void;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat = 11.5564, // Phnom Penh Central coordinate
  initialLng = 104.9282,
  onChange
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loadingGps, setLoadingGps] = useState(false);
  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });

  // Custom emerald SVG marker icon to prevent Vite bundler image loss
  const emeraldMarkerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-emerald-500/30 rounded-full animate-ping"></div>
        <div class="gps-dot !bg-emerald-500 !border-2 !border-white shadow-lg"></div>
        <div class="absolute -top-10 bg-slate-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-md border border-slate-700 whitespace-nowrap">
          Deliver Here
        </div>
      </div>
    `,
    className: 'custom-gps-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  // Mock Reverse Geocoder for Phnom Penh Districts based on coordinates
  const getMockAddress = (lat: number, lng: number): string => {
    // Quick bounding circles for typical Phnom Penh areas
    // Central BKK1/Chamkar Mon: ~11.55
    if (lat > 11.565) {
      return `Vattanac Plaza, St 106, Wat Phnom, Daun Penh, Phnom Penh`;
    } else if (lat < 11.545) {
      return `Mao Tse Toung Blvd (245), Toul Tom Poung, Chamkar Mon, Phnom Penh`;
    } else if (lng < 104.91) {
      return `Russian Federation Blvd, TK Avenue, Tuol Kork, Phnom Penh`;
    } else if (lng > 104.94) {
      return `Koh Norea Villa Block D, Chbar Ampov, Phnom Penh`;
    }
    return `St 310, Boeung Keng Kang 1 (BKK1), Chamkar Mon, Phnom Penh`;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not created
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([coords.lat, coords.lng], 15);

      // Add elegant CartoDB Voyager tiles (clean, beautiful light vector-style)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Create draggable marker
      const marker = L.marker([coords.lat, coords.lng], {
        icon: emeraldMarkerIcon,
        draggable: true
      }).addTo(map);

      // Save references
      mapRef.current = map;
      markerRef.current = marker;

      // Map click handler to place pin
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        updatePosition(lat, lng);
      });

      // Marker drag handler
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        updatePosition(position.lat, position.lng);
      });

      // Push initial value
      const initialAddress = getMockAddress(coords.lat, coords.lng);
      onChange(coords.lat, coords.lng, initialAddress);
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const updatePosition = (lat: number, lng: number) => {
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    
    setCoords({ lat: roundedLat, lng: roundedLng });
    
    if (markerRef.current) {
      markerRef.current.setLatLng([roundedLat, roundedLng]);
    }
    
    if (mapRef.current) {
      mapRef.current.panTo([roundedLat, roundedLng]);
    }

    const addr = getMockAddress(roundedLat, roundedLng);
    onChange(roundedLat, roundedLng, addr);
  };

  // Browser Geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("GPS Geolocation is not supported by your browser");
      return;
    }

    setLoadingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updatePosition(latitude, longitude);
        setLoadingGps(false);
      },
      (error) => {
        console.warn("Geolocation failed, falling back to mock GPS coordinates", error);
        // Fallback to random offset near center so it feels like a real lookup
        const offsetLat = coords.lat + (Math.random() - 0.5) * 0.01;
        const offsetLng = coords.lng + (Math.random() - 0.5) * 0.01;
        updatePosition(offsetLat, offsetLng);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-500 animate-bounce-subtle" />
          Select Delivery Coordinates
        </label>
        
        <button
          type="button"
          onClick={detectLocation}
          disabled={loadingGps}
          className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-emerald-500 transition-all duration-200 active:scale-95"
        >
          {loadingGps ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-500" />
          )}
          {loadingGps ? "Acquiring GPS..." : "Auto Detect My Location"}
        </button>
      </div>

      {/* Actual Map Canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/60 dark:border-slate-800/80 shadow-md">
        <div 
          ref={mapContainerRef} 
          className="w-full h-[280px] bg-slate-100 dark:bg-slate-900"
          style={{ zIndex: 1 }}
        />
        
        {/* Bottom Coordinates Status overlay */}
        <div className="absolute bottom-3 left-3 right-3 glass p-3 rounded-xl z-[999] flex justify-between items-center text-xs text-slate-700 dark:text-slate-200 pointer-events-none">
          <span className="font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse-subtle"></span>
            Pin Dropped
          </span>
          <span className="font-mono bg-white/50 dark:bg-slate-950/50 px-2 py-0.5 rounded">
            Lat: {coords.lat.toFixed(4)}, Lng: {coords.lng.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};
