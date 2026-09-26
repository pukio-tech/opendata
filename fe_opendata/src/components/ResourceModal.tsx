'use client';

import React, { useEffect, useState } from 'react';
import { Icons } from './Icons';
import { FichaDetail, ResourceItem } from '../types/mincetur';
import { apiService, API_BASE_URL } from '../services/api';
import { OfficialBadge } from './OfficialBadge';
import { TrustVerificationBadge } from './TrustVerificationBadge';
import { InstitutionalImage } from './InstitutionalImage';

interface ResourceModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
}

const formatPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}${url}`;
};

export const ResourceModal: React.FC<ResourceModalProps> = ({ resource, onClose }) => {
  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (resource?.codigo) {
      setLoading(true);
      apiService
        .getFichaDetail(resource.codigo)
        .then((data) => {
          setFicha(data);
          if (data?.galeria_fotos?.length) {
            setSelectedPhoto(data.galeria_fotos[0]);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [resource]);

  if (!resource) return null;

  // Extraer YouTube ID si está en texto o html en caso de que no venga en youtube_embed_url
  const extractYouTubeEmbed = () => {
    if (ficha?.youtube_embed_url) return ficha.youtube_embed_url;
    if (ficha?.youtube_id) return `https://www.youtube.com/embed/${ficha.youtube_id}`;
    
    // Buscar en secciones HTML
    if (ficha?.secciones) {
      for (const sec of ficha.secciones) {
        const match = sec.contenido_html.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
        if (match && match[1]) {
          return `https://www.youtube.com/embed/${match[1]}`;
        }
      }
    }
    return null;
  };

  const youtubeEmbedUrl = extractYouTubeEmbed();

  // Filtrar secciones para mostrar solo las requeridas
  const filteredSections = (ficha?.secciones || []).filter((sec) => {
    const t = sec.titulo.toLowerCase();
    return (
      t.includes('descrip') ||
      t.includes('ruta de acceso') ||
      t.includes('epoca propicia') ||
      t.includes('época propicia') ||
      t.includes('actividades desarrolladas') ||
      t.includes('datos del responsable') ||
      t.includes('responsable')
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-lg max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-card flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{resource.nombre}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1.5">
              <Icons.MapPin className="w-4 h-4 text-slate-400" />
              <span>
                {resource.desdpto} &gt; {resource.desprov} &gt; {resource.desubigeo}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <OfficialBadge variant="code">
                Ficha #{resource.codigo}
              </OfficialBadge>
              {resource.desjerarquia && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Jerarquía {resource.desjerarquia}
                </span>
              )}
              <TrustVerificationBadge source="MINCETUR" date="25/09/2026" />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Cargando información oficial...</p>
            </div>
          ) : (
            <>
              {/* Photo Showcase */}
              {ficha?.galeria_fotos && ficha.galeria_fotos.length > 0 && (
                <div>
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Icons.Camera className="w-4 h-4 text-slate-400" />
                    <span>Galería de Imágenes Oficiales</span>
                  </h3>
                  {selectedPhoto && (
                    <div className="w-full h-72 sm:h-96 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 border border-slate-200 dark:border-slate-800 relative">
                      <InstitutionalImage
                        src={formatPhotoUrl(selectedPhoto)}
                        alt={resource.nombre}
                        category={resource.categoria || 'Recurso Turístico'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {/* Thumbnails row */}
                  <div className="flex items-center gap-3 overflow-x-auto py-3 px-1.5 scrollbar-thin mt-2">
                    {ficha.galeria_fotos.map((photo, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPhoto(photo)}
                        className={`relative w-24 h-16 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          selectedPhoto === photo
                            ? 'border-[#0B3B60] ring-1 ring-[#0B3B60] opacity-100 shadow-xs z-10'
                            : 'border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <InstitutionalImage
                          src={formatPhotoUrl(photo)}
                          alt=""
                          category={resource.categoria || 'Recurso Turístico'}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Classification Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="p-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categoría</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block">{ficha?.categoria || resource.categoria || 'N/A'}</span>
                </div>
                <div className="p-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tipo</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block">{ficha?.tipo || resource.tipo_categoria || 'N/A'}</span>
                </div>
                <div className="p-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subtipo</span>
                  <span className="text-sm font-extrabold text-white mt-0.5 block">{ficha?.subtipo || resource.subtipo_categoria || 'N/A'}</span>
                </div>
                <div className="p-2">
                  <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Altitud</span>
                  <span className="text-sm font-extrabold text-amber-400 mt-0.5 block">{ficha?.altitud || 'Consultar Ficha'}</span>
                </div>
              </div>

              {/* 1. Descripción */}
              {ficha?.descripcion && (
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2.5 flex items-center gap-2">
                    <Icons.Info className="w-4 h-4 text-sky-400" />
                    <span>Descripción</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {ficha.descripcion}
                  </p>
                </div>
              )}

              {youtubeEmbedUrl && (
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-sky-500/30 shadow-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
                      <span>Material Audiovisual (Video en Vivo)</span>
                    </h3>
                  </div>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 bg-black shadow-inner">
                    <iframe
                      src={youtubeEmbedUrl}
                      title={`Video de ${resource.nombre}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Secciones Oficiales Filtradas (Ruta de Acceso, Época Propicia, Actividades Desarrolladas, Datos del Responsable) */}
              {filteredSections.length > 0 && (
                <div className="space-y-4">
                  {filteredSections.map((sec, idx) => {
                    const t = sec.titulo.toLowerCase();
                    // Si es descripción y ya la mostramos arriba, no duplicar
                    if (t.includes('descrip') && ficha?.descripcion) return null;

                    let icon = <Icons.Layers className="w-4 h-4 text-sky-400" />;
                    if (t.includes('ruta')) icon = <Icons.Navigation className="w-4 h-4 text-emerald-400" />;
                    if (t.includes('epoca') || t.includes('época')) icon = <Icons.Calendar className="w-4 h-4 text-amber-400" />;
                    if (t.includes('actividad')) icon = <Icons.Compass className="w-4 h-4 text-indigo-400" />;
                    if (t.includes('responsable')) icon = <Icons.Award className="w-4 h-4 text-rose-400" />;

                    return (
                      <div key={sec.id || idx} className="bg-slate-950/50 p-5 rounded-xl border border-slate-800">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200 mb-3 flex items-center gap-2">
                          {icon}
                          <span>{sec.titulo}</span>
                        </h3>

                        <div className="text-xs sm:text-sm text-slate-300 leading-relaxed overflow-x-auto">
                          {sec.contenido_html && sec.contenido_html.includes('<table') ? (
                            <div
                              className="official-table-wrapper prose prose-invert max-w-none text-xs"
                              dangerouslySetInnerHTML={{ __html: sec.contenido_html }}
                            />
                          ) : (
                            <div className="whitespace-pre-line leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                              {sec.contenido_texto}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Coordinates and External Links */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Icons.Navigation className="w-4 h-4 text-sky-400" />
                  <span>
                    GPS: Lon {resource.x?.toFixed(4)}, Lat {resource.y?.toFixed(4)}
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${resource.nombre}, ${resource.desdpto || ''}, Peru`,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none text-center bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 border border-slate-700"
                  >
                    <Icons.MapPin className="w-4 h-4 text-sky-400" />
                    <span>Ver en Google Maps</span>
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
