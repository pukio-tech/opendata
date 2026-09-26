'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PapaActivity } from '../types/papa';
import 'leaflet/dist/leaflet.css';

interface PapaOpenStreetMapProps {
  activities: PapaActivity[];
  selectedActivity: PapaActivity | null;
  onSelectActivity: (activity: PapaActivity) => void;
  selectedDepartmentSlug?: string;
  className?: string;
}

export const PapaOpenStreetMap: React.FC<PapaOpenStreetMapProps> = ({
  activities,
  selectedActivity,
  onSelectActivity,
  selectedDepartmentSlug,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // Inicializar mapa de OpenStreetMap
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Centro de Perú [Latitud, Longitud]
      const map = L.map(mapContainerRef.current, {
        center: [-9.19, -75.0152],
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // CartoDB Positron / OSM Tiles para visualización clara y moderna
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Controles de Zoom en esquina superior derecha
      L.control.zoom({ position: 'topright' }).addTo(map);

      const routeGroup = L.layerGroup().addTo(map);
      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      routeLayerRef.current = routeGroup;
      markersLayerRef.current = markersGroup;
      setMapReady(true);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Renderizar Marcadores y Trazado de Ruta Papal
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    let isCancelled = false;

    const renderMapElements = async () => {
      const L = (await import('leaflet')).default;
      if (isCancelled || !markersLayerRef.current || !routeLayerRef.current || !mapInstanceRef.current) return;

      markersLayerRef.current.clearLayers();
      routeLayerRef.current.clearLayers();

      const validPoints: [number, number][] = [];
      const routeCoordinates: [number, number][] = [];

      activities.forEach((item, index) => {
        const lat = item.coordenadas?.latitud;
        const lon = item.coordenadas?.longitud;

        if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) {
          return;
        }

        const latNum = Number(lat);
        const lonNum = Number(lon);
        validPoints.push([latNum, lonNum]);
        routeCoordinates.push([latNum, lonNum]);

        const isSelected = selectedActivity?.id === item.id;

        const bgBadge = isSelected
          ? 'bg-[#D91023] text-white ring-2 ring-[#D91023]/50 scale-125 z-50'
          : 'bg-[#0B3B60] text-white shadow-xs';

        const customIcon = L.divIcon({
          className: 'custom-papa-marker',
          html: `
            <div class="relative flex items-center justify-center cursor-pointer transition-transform transform hover:scale-110">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white dark:border-slate-900 transition-all ${bgBadge}">
                ${index + 1}
              </div>
              <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${isSelected ? 'bg-[#D91023]' : 'bg-[#0B3B60]'}"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([latNum, lonNum], { icon: customIcon });

        // Popup interactivo moderno
        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 font-sans max-w-[260px] text-slate-800 dark:text-slate-100';
        popupContent.innerHTML = `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-1.5">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-mono">
                ${item.hora} hrs
              </span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                ${item.dia_semana} ${item.fecha.slice(8, 10)} Nov
              </span>
            </div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              ${item.titulo}
            </h3>
            <div class="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
              <svg class="w-3.5 h-3.5 shrink-0 text-[#0B3B60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span class="font-medium truncate">${item.lugar}</span>
            </div>
            <p class="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
              ${item.descripcion}
            </p>
            <div class="text-[10px] text-slate-500 font-mono font-medium pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>${item.distrito ? `${item.distrito}, ` : ''}${item.departamento}</span>
              <span class="text-emerald-600 dark:text-emerald-400">✓ Verificado</span>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: 'papa-map-popup',
        });

        marker.on('click', () => {
          onSelectActivity(item);
        });

        markersLayerRef.current.addLayer(marker);

        if (isSelected) {
          setTimeout(() => {
            marker.openPopup();
          }, 100);
        }
      });

      // Trazar línea de ruta entre actividades correlativas
      if (routeCoordinates.length > 1) {
        const polyline = L.polyline(routeCoordinates, {
          color: '#d97706',
          weight: 3,
          opacity: 0.75,
          dashArray: '6, 8',
          lineCap: 'round',
          lineJoin: 'round',
        });
        routeLayerRef.current.addLayer(polyline);
      }

      // Auto-ajustar mapa a los puntos visibles
      if (validPoints.length > 0) {
        if (selectedActivity && selectedActivity.coordenadas) {
          mapInstanceRef.current.flyTo(
            [selectedActivity.coordenadas.latitud, selectedActivity.coordenadas.longitud],
            14,
            { duration: 1.2 }
          );
        } else if (validPoints.length === 1) {
          mapInstanceRef.current.setView(validPoints[0], 12);
        } else {
          const bounds = L.latLngBounds(validPoints);
          mapInstanceRef.current.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 13,
          });
        }
      }
    };

    renderMapElements();

    return () => {
      isCancelled = true;
    };
  }, [activities, selectedActivity, mapReady, selectedDepartmentSlug, onSelectActivity]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-9.19, -75.0152], 6, { duration: 1.2 });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Botón flotante para restablecer visión de todo el Perú */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
          title="Ver todo el territorio nacional"
        >
          <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Ver Todo el Perú</span>
        </button>
      </div>

      {/* Leyenda flotante en la parte inferior */}
      <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none">
        <div className="inline-flex flex-wrap items-center gap-2 p-2 px-3 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-lg text-[11px] pointer-events-auto">
          <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Leyenda:
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
            Santa Misa Masiva
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Jóvenes / Vigilia
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
            Encuentro Pastoral
          </span>
          <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
            Vuelo / Traslado
          </span>
        </div>
      </div>
    </div>
  );
};
