'use client';

import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { MuseoItem } from '../types/museo';
import { museosApi } from '../services/museosApi';

interface MuseoModalProps {
  museo: MuseoItem | null;
  onClose: () => void;
}

export const MuseoModal: React.FC<MuseoModalProps> = ({ museo, onClose }) => {
  const [detail, setDetail] = useState<MuseoItem | null>(museo);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (museo?.slug) {
      setDetail(museo);
      setSelectedImage(museo.imagen_portada || (museo.galeria?.[0]?.url) || null);

      setLoading(true);
      museosApi
        .getDetail(museo.slug)
        .then((fullData) => {
          if (fullData) {
            setDetail(fullData);
            if (!selectedImage) {
              setSelectedImage(fullData.imagen_portada || fullData.galeria?.[0]?.url || null);
            }
          }
        })
        .finally(() => setLoading(false));
    }
  }, [museo]);

  if (!museo) return null;

  const current = detail || museo;
  const isOpen = (current.estado || 'Abierto').toLowerCase().includes('abierto');
  const allImages = [
    ...(current.imagen_portada ? [{ url: current.imagen_portada, alt: current.nombre }] : []),
    ...(current.galeria || []),
  ].filter((v, i, a) => a.findIndex((t) => t.url === v.url) === i);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-900 dark:text-slate-100">
        {/* Encabezado del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-950">
          <div className="space-y-1.5 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isOpen
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {current.estado || 'Abierto'}
              </span>

              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300">
                {current.administracion || current.categoria || 'Ministerio de Cultura'}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {current.nombre}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Icons.MapPin className="w-4 h-4 text-sky-500 shrink-0" />
              <span>
                {current.departamento} {current.provincia ? `> ${current.provincia}` : ''}{' '}
                {current.distrito ? `> ${current.distrito}` : ''}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Cerrar modal"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Galería de Imágenes */}
          {allImages.length > 0 && (
            <div className="space-y-3">
              <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800">
                <img
                  src={selectedImage || allImages[0]?.url}
                  alt={current.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(img.url)}
                      className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                        selectedImage === img.url
                          ? 'border-sky-500 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Acciones Rápidas: Recorrido Virtual y Mapa */}
          <div className="flex flex-wrap gap-3">
            {current.recorrido_virtual_url && (
              <a
                href={current.recorrido_virtual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Icons.Eye className="w-4 h-4" />
                <span>Explorar en Recorrido Virtual 360°</span>
                <Icons.ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}

            {current.coleccion_virtual_url && (
              <a
                href={current.coleccion_virtual_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 font-bold text-xs hover:bg-sky-100 transition-colors"
              >
                <Icons.Layers className="w-4 h-4" />
                <span>Colección en Línea</span>
                <Icons.ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}

            {current.latitud && current.longitud && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${current.latitud},${current.longitud}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                <Icons.Navigation className="w-4 h-4 text-sky-500" />
                <span>Ver en Google Maps</span>
              </a>
            )}
          </div>

          {/* Reseña Histórica / Descripción */}
          {current.descripcion && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.FileText className="w-4 h-4 text-sky-500" />
                <span>Reseña Histórica y Colección</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                {current.descripcion}
              </p>
            </div>
          )}

          {/* Bloque: Horarios y Tarifario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Horario */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Icons.Clock className="w-4 h-4 text-emerald-500" />
                <span>Horario de Atención</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {current.horario_atencion || 'Consultar con administración del museo.'}
              </p>
            </div>

            {/* Tarifario */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Icons.Tag className="w-4 h-4 text-amber-500" />
                <span>Tarifas y Boletos</span>
              </h4>

              {current.tarifas && current.tarifas.length > 0 ? (
                <div className="space-y-1.5">
                  {current.tarifas.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-900 last:border-0"
                    >
                      <span className="text-slate-600 dark:text-slate-400">{t.tipo || t.descripcion}</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {t.precio === 0 ? 'Gratuito' : `S/ ${t.precio.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {current.tarifario_descripcion || 'Ingreso según tarifario oficial vigente.'}
                </p>
              )}
            </div>
          </div>

          {/* Servicios e Instalaciones */}
          {current.servicios && current.servicios.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Icons.Award className="w-4 h-4 text-sky-500" />
                <span>Servicios y Facilidades Disponibles</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {current.servicios.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    {s.icono_url ? (
                      <img src={s.icono_url} alt="" className="w-6 h-6 object-contain shrink-0" />
                    ) : (
                      <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {s.nombre}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Canales Oficiales y Contacto */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Información de Contacto y Canales Oficiales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {current.direccion && (
                <div className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                  <Icons.MapPin className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <span>{current.direccion}</span>
                </div>
              )}

              {current.telefono && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icons.Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{current.telefono}</span>
                </div>
              )}

              {current.email && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icons.Mail className="w-4 h-4 text-amber-500 shrink-0" />
                  <a href={`mailto:${current.email}`} className="text-sky-600 hover:underline">
                    {current.email}
                  </a>
                </div>
              )}

              {current.web_url && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Icons.Globe className="w-4 h-4 text-indigo-500 shrink-0" />
                  <a
                    href={current.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-600 hover:underline truncate"
                  >
                    Sitio web oficial
                  </a>
                </div>
              )}
            </div>

            {/* Redes Sociales */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-400">Redes:</span>
              {current.facebook_url && (
                <a
                  href={current.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 hover:bg-blue-100 transition-colors"
                  title="Facebook"
                >
                  <Icons.Share2 className="w-4 h-4" />
                </a>
              )}
              {current.instagram_url && (
                <a
                  href={current.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-pink-50 dark:bg-pink-950/50 text-pink-600 hover:bg-pink-100 transition-colors"
                  title="Instagram"
                >
                  <Icons.Instagram className="w-4 h-4" />
                </a>
              )}
              {current.url_origen && (
                <a
                  href={current.url_origen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1"
                >
                  <span>Fuente MINCUL</span>
                  <Icons.ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
