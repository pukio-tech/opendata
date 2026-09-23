'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'next-view-transitions';
import { ResourceItem } from '../types/mincetur';
import { createResourceSlug } from '../utils/slug';
import { cleanLabel } from '../utils/minceturTranslate';

interface OpenStreetMapProps {
  resources: ResourceItem[];
  selectedResource: ResourceItem | null;
  onSelectResource: (resource: ResourceItem) => void;
  className?: string;
}

export const OpenStreetMap: React.FC<OpenStreetMapProps> = ({
  resources,
  selectedResource,
  onSelectResource,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // 1. Cargar CSS de Leaflet de forma dinámica si no está presente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  // 2. Inicializar Mapa con OpenStreetMap
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      // Centro geográfico de Perú [Latitud, Longitud]
      const map = L.map(mapContainerRef.current, {
        center: [-9.19, -75.0152],
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // Capa de tiles oficial OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Controles de Zoom en esquina superior derecha
      L.control.zoom({ position: 'topright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
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

  // 3. Renderizar Marcadores y Actualizar Límites (Bounds)
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isCancelled = false;

    const renderMarkers = async () => {
      const L = (await import('leaflet')).default;
      if (isCancelled || !markersLayerRef.current || !mapInstanceRef.current) return;

      markersLayerRef.current.clearLayers();

      const validPoints: [number, number][] = [];

      resources.forEach((item) => {
        const lat = item.coordenadas?.latitud ?? item.y;
        const lon = item.coordenadas?.longitud ?? item.x;

        if (lat == null || lon == null || isNaN(Number(lat)) || isNaN(Number(lon))) {
          return;
        }

        const latNum = Number(lat);
        const lonNum = Number(lon);
        validPoints.push([latNum, lonNum]);

        const isSelected = selectedResource?.codigo === item.codigo;
        const cat = (item.categoria || '').toUpperCase();
        const sub = (item.subtipo_categoria || item.tipo_categoria || '').toUpperCase();

        // Color temático del marcador
        let markerColor = '#0284c7'; // Sky default
        if (cat.includes('NATURAL') || sub.includes('BOSQUE') || sub.includes('CERRO')) {
          markerColor = '#10b981'; // Emerald
        } else if (cat.includes('CULTURAL') || sub.includes('ARQUEOL') || sub.includes('TEMPLO')) {
          markerColor = '#f59e0b'; // Amber
        } else if (cat.includes('FOLK') || sub.includes('FESTIVIDAD')) {
          markerColor = '#f43f5e'; // Rose
        }

        const iconHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            background-color: ${isSelected ? '#f59e0b' : markerColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s;
            ${isSelected ? 'transform: scale(1.25); z-index: 1000; box-shadow: 0 0 15px rgba(245, 158, 11, 0.8);' : ''}
          ">
            <svg style="width: 14px; height: 14px; color: ${isSelected ? '#0f172a' : '#ffffff'};" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-leaflet-marker',
          iconSize: [isSelected ? 32 : 26, isSelected ? 32 : 26],
          iconAnchor: [isSelected ? 16 : 13, isSelected ? 16 : 13],
        });

        const marker = L.marker([latNum, lonNum], { icon: customIcon });

        const slug = createResourceSlug(item.nombre, item.codigo);
        const photo = item.imagen || item.foto_url || `http://localhost:3001/api/photos/${item.codigo}`;

        const popupContent = `
          <div style="font-family: inherit; font-size: 12px; max-width: 220px; border-radius: 12px; overflow: hidden;">
            ${photo ? `
              <div style="height: 100px; width: 100%; overflow: hidden; background: #0f172a;">
                <img src="${photo}" alt="${item.nombre}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'"/>
              </div>
            ` : ''}
            <div style="padding: 10px;">
              <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #f59e0b; display: block; margin-bottom: 2px;">
                ${item.desdpto || 'Perú'} • Ficha #${item.codigo}
              </span>
              <strong style="font-size: 13px; color: #0f172a; line-height: 1.2; display: block; margin-bottom: 4px;">
                ${item.nombre}
              </strong>
              <span style="font-size: 11px; color: #64748b; display: block; margin-bottom: 8px;">
                ${item.categoria || 'Recurso Turístico'}
              </span>
              <a href="/turismo/${slug}" style="display: inline-block; background: #0284c7; color: white; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 11px; text-align: center; width: 100%; box-sizing: border-box;">
                Ver Ficha Técnica &rarr;
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 240, className: 'custom-osm-popup' });

        marker.on('click', () => {
          onSelectResource(item);
        });

        markersLayerRef.current.addLayer(marker);
      });

      // Ajustar vista a los marcadores si hay puntos válidos
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [30, 30],
          maxZoom: validPoints.length === 1 ? 14 : 12,
        });
      }
    };

    renderMarkers();

    return () => {
      isCancelled = true;
    };
  }, [mapReady, resources, selectedResource?.codigo]);

  // 4. Centrar en Perú
  const handleResetPeruView = async () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([-9.19, -75.0152], 6, { animate: true });
  };

  return (
    <div className={`relative w-full h-full rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 bg-slate-950 ${className}`}>
      {/* Contenedor del Mapa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px] sm:min-h-[520px] z-0" />

      {/* Barra Superior con Badge de OpenStreetMap */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-700/80 text-xs font-mono text-slate-200 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-bold">OpenStreetMap</span>
          <span className="text-slate-400">|</span>
          <span className="text-sky-400 font-bold">{resources.length} Lugares</span>
        </div>
      </div>

      {/* Botón de Reset Vista Perú */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <button
          type="button"
          onClick={handleResetPeruView}
          className="px-3 py-1.5 rounded-lg bg-slate-950/85 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold backdrop-blur-md transition-all shadow-lg flex items-center gap-1.5 cursor-pointer"
          title="Centrar vista en todo el Perú"
        >
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span>Vista Perú</span>
        </button>
      </div>
    </div>
  );
};
