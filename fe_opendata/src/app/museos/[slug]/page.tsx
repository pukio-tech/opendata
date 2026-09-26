'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { useParams } from 'next/navigation';
import { museosApi } from '../../../services/museosApi';
import { MuseoItem } from '../../../types/museo';
import { Icons } from '../../../components/Icons';
import { useLanguage } from '../../../context/LanguageContext';
import { AdsterraNativeBanner } from '../../../components/AdsterraNativeBanner';
import { AdsterraDisplayBanner, ResponsiveLeaderboard } from '../../../components/AdsterraDisplayBanner';
import { OfficialBadge } from '../../../components/OfficialBadge';
import { TrustVerificationBadge } from '../../../components/TrustVerificationBadge';
import { InstitutionalImage } from '../../../components/InstitutionalImage';
import { MuseoCard } from '../../../components/MuseoCard';

const DynamicMuseoMap = dynamic(
  () => import('../../../components/MuseoOpenStreetMap').then((mod) => mod.MuseoOpenStreetMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

function MuseoDetailPageContent() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useTransitionRouter();
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug as string) || '';

  const [museo, setMuseo] = useState<MuseoItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);
  const [relatedMuseos, setRelatedMuseos] = useState<MuseoItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    museosApi
      .getDetail(slug)
      .then((data) => {
        if (data) {
          setMuseo(data);
          setActivePhotoIndex(0);
          setImgError(false);

          // Cargar museos relacionados (del mismo departamento o catálogo general)
          setLoadingRelated(true);
          (async () => {
            try {
              let results: MuseoItem[] = [];
              if (data.departamento) {
                const resDept = await museosApi.searchMuseos({ department: data.departamento, limit: 8 });
                results = (resDept?.data || []).filter((m) => m.slug !== data.slug);
              }
              if (results.length < 4) {
                const resGeneral = await museosApi.searchMuseos({ limit: 8 });
                const more = (resGeneral?.data || []).filter(
                  (m) => m.slug !== data.slug && !results.some((r) => r.slug === m.slug)
                );
                results = [...results, ...more];
              }
              setRelatedMuseos(results.slice(0, 4));
            } catch (e) {
              console.error('Error al cargar museos relacionados:', e);
              setRelatedMuseos([]);
            } finally {
              setLoadingRelated(false);
            }
          })();
        } else {
          setError('El museo solicitado no existe o no se encuentra disponible.');
        }
      })
      .catch((err) => {
        console.error('Error cargando detalle de museo:', err);
        setError('Error al conectar con la base de datos de museos.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Actualizar título dinámico
  useEffect(() => {
    if (museo?.nombre) {
      const dpto = museo.departamento ? ` (${museo.departamento})` : '';
      document.title = `${museo.nombre}${dpto} | Museos del Perú | OpenData`;
    }
  }, [museo]);

  const allPhotos = useMemo(() => {
    if (!museo) return [];
    const list: string[] = [];
    if (museo.imagen_portada) list.push(museo.imagen_portada);
    if (museo.imagen_tarjeta && !list.includes(museo.imagen_tarjeta)) list.push(museo.imagen_tarjeta);
    if (museo.galeria && museo.galeria.length > 0) {
      museo.galeria.forEach((g) => {
        if (g.url && !list.includes(g.url)) list.push(g.url);
      });
    }
    return list;
  }, [museo]);

  const currentPhoto = allPhotos[activePhotoIndex] || allPhotos[0] || null;

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    setImgError(false);
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
    setImgError(false);
  };

  const openLightbox = (index: number = activePhotoIndex) => {
    setActivePhotoIndex(index);
    setIsLightboxOpen(true);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isLightboxOpen, allPhotos.length]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCoords = (coords: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(coords);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const descriptionParagraphs = useMemo(() => {
    if (!museo?.descripcion) return [];
    return museo.descripcion
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  }, [museo?.descripcion]);

  const googleMapsLink =
    museo?.latitud && museo?.longitud
      ? `https://www.google.com/maps?q=${museo.latitud},${museo.longitud}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${museo?.nombre || ''}, ${museo?.distrito ? museo.distrito + ', ' : ''}${museo?.provincia ? museo.provincia + ', ' : ''}${museo?.departamento ? museo.departamento + ', ' : ''}Peru`
        )}`;

  const isOpen = (museo?.estado || 'Abierto').toLowerCase().includes('abierto');
  const hasCoordinates = typeof museo?.latitud === 'number' && typeof museo?.longitud === 'number';

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* ========================================================================= */}
        {/* 1. NAVEGACIÓN Y ACCIONES SUPERIORES INSTITUCIONALES */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors flex items-center gap-1.5 font-medium">
              <Icons.Compass className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
              <span>{t('ficha.breadcrumbHome') || 'Inicio'}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/museos" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors font-medium">
              Museos
            </Link>
            {museo?.departamento && (
              <>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <Link
                  href={`/museos?department=${encodeURIComponent(museo.departamento)}`}
                  className="hover:text-[#0B3B60] dark:hover:text-white transition-colors font-medium"
                >
                  {museo.departamento}
                </Link>
              </>
            )}
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[200px] sm:max-w-md">
              {museo?.nombre || 'Ficha del Museo'}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enlace Copiado</span>
                </>
              ) : (
                <>
                  <Icons.Share className="w-3.5 h-3.5 text-slate-400" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Volver al Catálogo</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-36 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Cargando ficha oficial del museo...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && (error || !museo) && (
          <div className="py-24 text-center max-w-lg mx-auto p-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="w-16 h-16 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-[#D91023]">
              <Icons.Building className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Museo no encontrado
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {error || 'No se encontró el registro solicitado en el inventario oficial de museos.'}
            </p>
            <Link
              href="/museos"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Explorar otros museos
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ENCABEZADO INSTITUCIONAL DE LA FICHA DEL MUSEO */}
        {/* ========================================================================= */}
        {!loading && museo && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header del recurso */}
            <div className="space-y-3">
              {/* Badges de Metadatos Oficiales */}
              <div className="flex flex-wrap items-center gap-2">
                <OfficialBadge variant={isOpen ? 'activo' : 'nohabido'}>
                  ● {museo.estado || 'Abierto'}
                </OfficialBadge>

                <OfficialBadge variant="code">
                  {museo.administracion || museo.categoria || 'Ministerio de Cultura'}
                </OfficialBadge>

                {museo.recorrido_virtual_url && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 text-xs font-bold shadow-xs">
                    <Icons.Eye className="w-3.5 h-3.5" />
                    <span>Recorrido 360° Disponible</span>
                  </span>
                )}

                <TrustVerificationBadge source="MINCUL" date="25/09/2026" />
              </div>

              {/* Título Principal */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {museo.nombre}
              </h1>

              {/* Barra de Ubicación Geográfica Oficial */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  <Icons.MapPin className="w-4 h-4 text-[#0B3B60] dark:text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">{museo.departamento || 'Perú'}</strong>
                    {museo.provincia && <span> • {museo.provincia}</span>}
                    {museo.distrito && <span> • {museo.distrito}</span>}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3B60] dark:text-sky-400 hover:underline"
                  >
                    <span>Ver en el mapa</span>
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {museo.url_origen && (
                    <a
                      href={museo.url_origen}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0B3B60] dark:hover:text-sky-400 hover:underline ml-2"
                    >
                      <span>Ficha Fuente MINCUL</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. SHOWCASE FOTOGRÁFICO INSTITUCIONAL */}
            {/* ========================================================================= */}
            <div className="space-y-4">
              <div
                onClick={() => openLightbox(activePhotoIndex)}
                className="relative w-full h-[340px] sm:h-[480px] lg:h-[520px] rounded-lg overflow-hidden bg-slate-950 shadow-xs border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer group"
              >
                <InstitutionalImage
                  src={currentPhoto || ''}
                  alt={museo.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                  containerClassName="w-full h-full"
                  category={museo.categoria || 'Museo'}
                  code={museo.id_museo}
                  source="MINCUL"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                {/* Botón Ver Pantalla Completa Superior Derecho */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(activePhotoIndex);
                  }}
                  className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-medium backdrop-blur-md border border-white/20 hover:border-white/40 shadow-xs transition-all cursor-pointer"
                >
                  <Icons.Maximize className="w-4 h-4 text-white" />
                  <span>Pantalla Completa</span>
                </button>

                {/* Flechas de cambio de imagen directa tipo Slide */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md border border-white/15 hover:border-white/30 transition-all hover:scale-105 shadow-md cursor-pointer"
                      aria-label="Foto anterior"
                    >
                      <Icons.ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-2.5 sm:p-3 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white backdrop-blur-md border border-white/15 hover:border-white/30 transition-all hover:scale-105 shadow-md cursor-pointer"
                      aria-label="Siguiente foto"
                    >
                      <Icons.ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Subtítulo integrado en la foto */}
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white text-xs pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
                    <Icons.Camera className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-medium">Fotografía Oficial del Museo</span>
                  </div>
                  {allPhotos.length > 1 && (
                    <span className="text-slate-200 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 font-mono text-[11px] font-medium">
                      {activePhotoIndex + 1} / {allPhotos.length} fotos
                    </span>
                  )}
                </div>
              </div>

              {/* Tira de Miniaturas */}
              {allPhotos.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
                  {allPhotos.map((photo, index) => {
                    const isCurrent = activePhotoIndex === index;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setActivePhotoIndex(index);
                          setImgError(false);
                        }}
                        className={`relative w-24 sm:w-28 h-16 sm:h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#0B3B60] ring-1 ring-[#0B3B60]/40 shadow-xs'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <InstitutionalImage
                          src={photo}
                          alt=""
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                          category="Museo"
                          source="MINCUL"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Lightbox a Pantalla Completa con Slider */}
            {isLightboxOpen && (
              <div
                className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none"
                onClick={closeLightbox}
              >
                {/* Header Lightbox */}
                <div
                  className="flex items-center justify-between gap-4 pb-3 border-b border-white/10 text-white max-w-7xl mx-auto w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-sm font-bold text-white truncate max-w-md">
                      {museo.nombre}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      • {museo.departamento}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs font-mono font-medium px-3 py-1 rounded-md bg-white/10 border border-white/10 text-slate-200">
                      Foto {activePhotoIndex + 1} de {allPhotos.length}
                    </span>
                    <button
                      type="button"
                      onClick={closeLightbox}
                      className="p-2 rounded-md bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white transition-colors cursor-pointer"
                      title="Cerrar visor (Esc)"
                    >
                      <Icons.X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Área central con flechas de Slide */}
                <div
                  className="relative flex-1 flex items-center justify-center py-4 max-w-7xl mx-auto w-full overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {allPhotos.length > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 hover:border-white/40 shadow-2xl transition-all hover:scale-105 cursor-pointer"
                      title="Foto anterior (Flecha Izquierda)"
                    >
                      <Icons.ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  )}

                  <div className="relative max-h-[75vh] max-w-[90vw] flex items-center justify-center">
                    {currentPhoto && (
                      <img
                        src={currentPhoto}
                        alt={museo.nombre}
                        className="max-h-[75vh] max-w-[90vw] object-contain rounded-md shadow-2xl transition-all duration-300"
                      />
                    )}
                  </div>

                  {allPhotos.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 hover:border-white/40 shadow-2xl transition-all hover:scale-105 cursor-pointer"
                      title="Siguiente foto (Flecha Derecha)"
                    >
                      <Icons.ChevronRight className="w-6 h-6 text-white" />
                    </button>
                  )}
                </div>

                {/* Tira inferior de miniaturas en pantalla completa */}
                {allPhotos.length > 1 && (
                  <div
                    className="max-w-4xl mx-auto w-full pt-3 border-t border-white/10 flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto py-2 scrollbar-thin"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {allPhotos.map((photo, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActivePhotoIndex(idx);
                          setImgError(false);
                        }}
                        className={`relative w-16 sm:w-20 h-11 sm:h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          activePhotoIndex === idx
                            ? 'border-[#0B3B60] ring-2 ring-white/30 scale-105'
                            : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={photo}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Banner Display Responsivo (728x90 en desktop, 320x50 en móvil) */}
            <ResponsiveLeaderboard className="my-6" />

            {/* ========================================================================= */}
            {/* 4. DISTRIBUCIÓN EDITORIAL (NARRATIVO + PANEL TÉCNICO) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* COLUMNA IZQUIERDA: FLUJO NARRATIVO EDITORIAL (8 COLUMNAS) */}
              <div className="lg:col-span-8 space-y-10">
                {/* 1. SECCIÓN: HISTORIA Y COLECCIONES */}
                {descriptionParagraphs.length > 0 && (
                  <section className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <Icons.FileText className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                        Historia y Colecciones
                      </h2>
                    </div>

                    <div className="space-y-4 pt-1">
                      {descriptionParagraphs.map((paragraph, pIdx) => {
                        const isLead = pIdx === 0;
                        return (
                          <div
                            key={pIdx}
                            className={
                              isLead
                                ? 'text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-normal border-l-4 border-[#0B3B60] pl-4 sm:pl-5'
                                : 'text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-normal'
                            }
                          >
                            {paragraph}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 2. SECCIÓN: PLANIFICA TU VISITA (Horarios, Tarifas, Servicios y Mapa) */}
                <section className="space-y-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <Icons.Calendar className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                      Planifica tu Visita
                    </h2>
                  </div>

                  {/* Horarios y Tarifas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Horario de Atención */}
                    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Icons.Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Horario de Atención
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {museo.horario_atencion || 'Consultar con administración del museo antes de la visita.'}
                      </p>
                    </div>

                    {/* Tarifario Oficial */}
                    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <Icons.Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Tarifario Oficial
                        </h3>
                      </div>

                      {museo.tarifas && museo.tarifas.length > 0 ? (
                        <div className="space-y-2">
                          {museo.tarifas.map((tar, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                              <span className="text-slate-600 dark:text-slate-400 font-medium">
                                {tar.tipo || tar.descripcion}
                              </span>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {tar.precio === 0 ? 'Gratuito' : `S/ ${tar.precio.toFixed(2)}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {museo.tarifario_descripcion || 'Ingreso según tarifario vigente del Ministerio de Cultura.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Servicios e Instalaciones Disponibles con Iconos Oficiales como Imágenes */}
                  {museo.servicios && museo.servicios.length > 0 && (
                    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Icons.Award className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                            Servicios e Instalaciones Disponibles
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {museo.servicios.length} servicios
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                        {museo.servicios.map((srv, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 rounded-md bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-[#0B3B60]/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 transition-all shadow-xs"
                          >
                            <div className="w-8 h-8 rounded-md bg-white dark:bg-slate-900 p-1 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 shadow-xs">
                              {srv.icono_url ? (
                                <img
                                  src={srv.icono_url}
                                  alt={srv.nombre}
                                  className="w-full h-full object-contain filter dark:brightness-125 dark:contrast-125"
                                  loading="lazy"
                                />
                              ) : (
                                <Icons.CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </div>
                            <span className="leading-snug">{srv.nombre}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mapa de Ubicación Geográfica Leaflet OpenStreetMap */}
                  {hasCoordinates && (
                    <div className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Icons.MapPin className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                          <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                            Ubicación Geográfica y Cómo Llegar
                          </h3>
                        </div>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {museo.latitud?.toFixed(4)}, {museo.longitud?.toFixed(4)}
                        </span>
                      </div>

                      <DynamicMuseoMap
                        museos={[museo]}
                        selectedMuseo={museo}
                        onSelectMuseo={() => {}}
                        className="h-80"
                      />
                    </div>
                  )}
                </section>
              </div>

              {/* COLUMNA DERECHA: FICHA TÉCNICA OFICIAL STICKY (4 COLUMNAS) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                {/* 1. Panel Técnico de Especificaciones + Acciones Oficiales */}
                <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Icons.Layers className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                      <span>Ficha Técnica Oficial</span>
                    </span>
                    <OfficialBadge variant="code">
                      MINCUL
                    </OfficialBadge>
                  </div>

                  <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-0">
                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Categoría / Tipo</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {museo.tipo_museo || museo.categoria || 'Museo de Sitio / Histórico'}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Administración</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {museo.administracion || 'Ministerio de Cultura'}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Estado Operativo</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        <span className={isOpen ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-rose-700 dark:text-rose-400 font-bold'}>
                          {museo.estado || 'Abierto'}
                        </span>
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">Región / Dpto.</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {museo.departamento || 'Perú'}
                      </dd>
                    </div>

                    {museo.provincia && (
                      <div className="py-2.5 flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Provincia</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white text-right">
                          {museo.provincia}
                        </dd>
                      </div>
                    )}

                    {museo.distrito && (
                      <div className="py-2.5 flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Distrito</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white text-right">
                          {museo.distrito}
                        </dd>
                      </div>
                    )}

                    {museo.direccion && (
                      <div className="py-2.5 flex justify-between gap-3">
                        <dt className="text-slate-500 dark:text-slate-400 shrink-0">Dirección</dt>
                        <dd className="font-semibold text-slate-900 dark:text-white text-right">
                          {museo.direccion}
                        </dd>
                      </div>
                    )}

                    {hasCoordinates && (
                      <div className="py-2.5 flex justify-between items-center gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Coordenadas</dt>
                        <dd className="text-right">
                          <button
                            type="button"
                            onClick={() => handleCopyCoords(`${museo.latitud}, ${museo.longitud}`)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors cursor-pointer"
                            title="Copiar coordenadas"
                          >
                            <span>
                              {museo.latitud?.toFixed(4)}, {museo.longitud?.toFixed(4)}
                            </span>
                            {copiedCoords ? (
                              <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Icons.Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Botón CTA Google Maps */}
                  <div className="pt-2">
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Icons.MapPin className="w-4 h-4 text-white flex-shrink-0" />
                      <span>Ver ubicación en Google Maps</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>

                  {/* Apartado: Explora en Línea dentro de Ficha Técnica */}
                  {(museo.recorrido_virtual_url || museo.coleccion_virtual_url || museo.web_url || museo.url_origen) && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                      <span className="text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase flex items-center gap-1.5">
                        <Icons.Compass className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Explora en Línea</span>
                      </span>

                      <div className="space-y-2">
                        {museo.recorrido_virtual_url && (
                          <a
                            href={museo.recorrido_virtual_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3.5 rounded-md bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icons.Eye className="w-4 h-4 text-slate-950 shrink-0" />
                              <span>Recorrido Virtual 360°</span>
                            </div>
                            <Icons.ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        )}

                        {museo.coleccion_virtual_url && (
                          <a
                            href={museo.coleccion_virtual_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0B3B60] dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icons.Layers className="w-4 h-4 text-[#0B3B60] dark:text-slate-400 shrink-0" />
                              <span>Colección en Línea</span>
                            </div>
                            <Icons.ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        )}

                        {museo.web_url && (
                          <a
                            href={museo.web_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-3.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icons.Globe className="w-4 h-4 text-slate-500 shrink-0" />
                              <span>Página Web Oficial</span>
                            </div>
                            <Icons.ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </a>
                        )}

                        {museo.url_origen && (
                          <a
                            href={museo.url_origen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium text-[11px] transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icons.FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>Ficha Fuente MINCUL</span>
                            </div>
                            <Icons.ExternalLink className="w-3 h-3 text-slate-400 opacity-70 group-hover:opacity-100" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Banner Display 300x250 MPU en Sidebar */}
                <AdsterraDisplayBanner size="300x250" className="my-2" />
              </div>
            </div>

            {/* Pie de navegación hacia catálogo */}
            <div className="pt-4 flex items-center justify-between">
              <Link
                href="/museos"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
                <span>Explorar más museos en el catálogo</span>
              </Link>
            </div>

            {/* MUSEOS RELACIONADOS (GRID DE 4 PARA MAYOR INTERACCIÓN) */}
            {(loadingRelated || relatedMuseos.length > 0) && (
              <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icons.Landmark className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Museos Relacionados
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Otros museos y espacios culturales en {museo.departamento ? `${museo.departamento}` : 'el Perú'}.
                    </p>
                  </div>

                  {museo.departamento && (
                    <Link
                      href={`/museos?departamento=${encodeURIComponent(museo.departamento)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3B60] dark:text-sky-400 hover:underline transition-colors"
                    >
                      <span>Ver más en {museo.departamento}</span>
                      <Icons.ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

                {loadingRelated ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-72 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse p-4 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                        </div>
                        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {relatedMuseos.map((rel) => (
                      <MuseoCard key={rel.id_museo} museo={rel} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Anuncio Nativo Adsterra Estratégico */}
            <AdsterraNativeBanner className="mt-8 mb-4" />
          </div>
        )}
      </div>
    </main>
  );
}

export default function MuseoDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-36">
          <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MuseoDetailPageContent />
    </Suspense>
  );
}
