'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MuseoItem } from '../types/museo';
import 'leaflet/dist/leaflet.css';

interface MuseoOpenStreetMapProps {
  museos: MuseoItem[];
  selectedMuseo: MuseoItem | null;
  onSelectMuseo: (museo: MuseoItem) => void;
  className?: string;
}

export const MuseoOpenStreetMap: React.FC<MuseoOpenStreetMapProps> = ({
  museos,
  selectedMuseo,
  onSelectMuseo,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  // 1. Inicializar Mapa Leaflet
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import('leaflet')).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [-9.19, -75.0152],
        zoom: 6,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

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

  // 2. Renderizar Marcadores
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !markersLayerRef.current) return;

    let isMounted = true;

    const updateMarkers = async () => {
      const L = (await import('leaflet')).default;
      if (!isMounted) return;

      markersLayerRef.current.clearLayers();

      const validMuseos = museos.filter(
        (m) =>
          typeof m.latitud === 'number' &&
          typeof m.longitud === 'number' &&
          !isNaN(m.latitud) &&
          !isNaN(m.longitud),
      );

      if (validMuseos.length === 0) return;

      const bounds = L.latLngBounds([]);

      validMuseos.forEach((museo) => {
        const isSelected = selectedMuseo?.slug === museo.slug;
        const lat = museo.latitud!;
        const lng = museo.longitud!;

        const markerHtml = `
          <div style="
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            background: ${isSelected ? '#0284c7' : '#d97706'};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <svg style="width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
              <path d="M12 3L2 9v2h20V9L12 3zm-7 8v7h3v-7H5zm5 0v7h4v-7h-4zm6 0v7h3v-7h-3zM2 20v2h20v-2H2z"/>
            </svg>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: 'custom-museo-marker',
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
        });

        const marker = L.marker([lat, lng], { icon });

        // Popup interactivo
        const imgTag = museo.imagen_tarjeta || museo.imagen_portada
          ? `<img src="${museo.imagen_tarjeta || museo.imagen_portada}" alt="${museo.nombre}" style="width:100%;height:100px;object-fit:cover;border-radius:8px 8px 0 0;"/>`
          : '';

        const popupContent = `
          <div style="width: 220px; font-family: inherit; font-size: 12px;">
            ${imgTag}
            <div style="padding: 10px;">
              <span style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase;">
                ${museo.departamento || 'Perú'}
              </span>
              <h4 style="font-size: 13px; font-weight: 700; margin: 4px 0; color: #0f172a; line-height: 1.3;">
                ${museo.nombre}
              </h4>
              <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">
                ${museo.direccion || ''}
              </p>
              <button 
                id="btn-popup-${museo.id_museo}"
                style="
                  width: 100%;
                  background: #0284c7;
                  color: white;
                  border: none;
                  padding: 6px 10px;
                  border-radius: 6px;
                  font-weight: 700;
                  font-size: 11px;
                  cursor: pointer;
                "
              >
                Ver Ficha Completa
              </button>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 240, className: 'museo-leaflet-popup' });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-popup-${museo.id_museo}`);
          if (btn) {
            btn.onclick = () => onSelectMuseo(museo);
          }
        });

        marker.on('click', () => {
          onSelectMuseo(museo);
        });

        markersLayerRef.current.addLayer(marker);
        bounds.extend([lat, lng]);
      });

      if (bounds.isValid() && validMuseos.length > 0) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    };

    updateMarkers();

    return () => {
      isMounted = false;
    };
  }, [mapReady, museos, selectedMuseo, onSelectMuseo]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
    </div>
  );
};
