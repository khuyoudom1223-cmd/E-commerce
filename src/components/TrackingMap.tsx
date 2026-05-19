import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface TrackingMapProps {
  riderLat?: number;
  riderLng?: number;
  customerLat: number;
  customerLng: number;
  vendorLat?: number;
  vendorLng?: number;
  riderName?: string;
  vehicleType?: 'moto' | 'tuktuk' | 'car';
  status?: string;
}

export const TrackingMap: React.FC<TrackingMapProps> = ({
  riderLat,
  riderLng,
  customerLat,
  customerLng,
  vendorLat = 11.5564, // Fallback Phnom Penh center
  vendorLng = 104.9282,
  riderName = 'Rider Courier',
  vehicleType = 'moto',
  status = 'pending'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Marker references
  const vendorMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // --- CUSTOM MARKERS SVG ---

  const vendorIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-amber-500/20 rounded-full animate-ping"></div>
        <div class="w-10 h-10 bg-amber-500 text-white rounded-xl shadow-lg border border-white flex items-center justify-center">
          🏪
        </div>
      </div>
    `,
    className: 'vendor-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const customerIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping"></div>
        <div class="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg border border-white flex items-center justify-center">
          📍
        </div>
      </div>
    `,
    className: 'customer-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });

  const riderIcon = L.divIcon({
    html: `
      <div class="relative flex flex-col items-center justify-center">
        <div class="absolute w-12 h-12 bg-emerald-500/30 rounded-full animate-ping"></div>
        <div class="w-12 h-12 bg-emerald-500 text-white rounded-2xl shadow-xl border-2 border-white flex items-center justify-center text-xl hover:scale-110 transition-transform duration-200">
          ${vehicleType === 'moto' ? '🛵' : vehicleType === 'tuktuk' ? '🛺' : '🚗'}
        </div>
        <div class="absolute -bottom-8 bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap">
          ${riderName}
        </div>
      </div>
    `,
    className: 'rider-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // 1. Initialize Map
    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([customerLat, customerLng], 14);

      // CartoDB Voyager Map Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add Vendor Pin
      const vendorMarker = L.marker([vendorLat, vendorLng], { icon: vendorIcon }).addTo(map);
      vendorMarker.bindPopup('<b class="font-display">ElectroWorld Store</b><br><span class="text-xs">Preparing items</span>');
      vendorMarkerRef.current = vendorMarker;

      // Add Customer Pin
      const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon }).addTo(map);
      customerMarker.bindPopup('<b class="font-display">Your Residence</b><br><span class="text-xs">Delivery Address</span>');
      customerMarkerRef.current = customerMarker;

      // Draw standard curved polyline (dashed gray) representing standard route
      const points: L.LatLngExpression[] = [
        [vendorLat, vendorLng],
        [customerLat, customerLng]
      ];
      const routeLine = L.polyline(points, {
        color: '#10b981',
        weight: 3,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);
      routeLineRef.current = routeLine;

      mapRef.current = map;
      
      // Auto Zoom to fit Vendor and Customer
      const bounds = L.latLngBounds([vendorLat, vendorLng], [customerLat, customerLng]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Proactively respond to Rider dynamic coordinate updates from server
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    if (riderLat && riderLng) {
      // Create or update Rider Marker
      if (!riderMarkerRef.current) {
        const rMarker = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
        rMarker.bindPopup(`<b>${riderName}</b><br><span class="text-xs">Courier En-Route</span>`);
        riderMarkerRef.current = rMarker;
      } else {
        riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      }

      // Dynamically update the route Polyline to show path from Rider to Customer
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([
          [vendorLat, vendorLng],
          [riderLat, riderLng],
          [customerLat, customerLng]
        ]);
      }

      // Auto Adjust zoom/camera window bounds to fit all nodes
      const bounds = L.latLngBounds([
        [vendorLat, vendorLng],
        [riderLat, riderLng],
        [customerLat, customerLng]
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else {
      // Remove Rider Marker if not active
      if (riderMarkerRef.current) {
        map.removeLayer(riderMarkerRef.current);
        riderMarkerRef.current = null;
      }
      
      // Reset Route Line
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([
          [vendorLat, vendorLng],
          [customerLat, customerLng]
        ]);
      }
    }
  }, [riderLat, riderLng, customerLat, customerLng, vendorLat, vendorLng, riderName, vehicleType]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden" 
        style={{ zIndex: 1 }}
      />
      
      {/* Floating Status Indicator */}
      <div className="absolute top-3 right-3 glass px-3 py-1.5 rounded-lg z-[999] pointer-events-none flex items-center gap-2 text-xs">
        <span className={`w-2.5 h-2.5 rounded-full inline-block ${
          status === 'out_for_delivery' ? 'bg-emerald-500 animate-pulse' :
          status === 'delivered' ? 'bg-blue-500' : 'bg-amber-400'
        }`}></span>
        <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
};
