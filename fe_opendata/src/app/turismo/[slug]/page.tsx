'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { useParams } from 'next/navigation';
import { apiService, API_BASE_URL, getPhotoUrl } from '../../../services/api';
import { FichaDetail, FichaRutaAcceso, FichaEpocaPropicia } from '../../../types/mincetur';
import { extractCodeFromSlug } from '../../../utils/slug';
import { Icons } from '../../../components/Icons';
import { useLanguage } from '../../../context/LanguageContext';
import { DynamicText } from '../../../utils/dynamicTranslate';
import { AdsterraNativeBanner } from '../../../components/AdsterraNativeBanner';
import { AdsterraDisplayBanner, ResponsiveLeaderboard } from '../../../components/AdsterraDisplayBanner';
import { OfficialBadge } from '../../../components/OfficialBadge';
import { TrustVerificationBadge } from '../../../components/TrustVerificationBadge';
import { InstitutionalImage } from '../../../components/InstitutionalImage';

const formatPhotoUrl = (url: string | null | undefined, cod?: number): string => {
  if (!url) {
    if (cod) return getPhotoUrl(cod);
    return '';
  }
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}${url}`;
};

const getActivityIcon = (actName: string) => {
  const a = (actName || '').toLowerCase();
  if (
    a.includes('caminata') ||
    a.includes('trekking') ||
    a.includes('senderismo') ||
    a.includes('escalada') ||
    a.includes('ciclismo')
  ) {
    return <Icons.Footprints className="w-4 h-4 text-emerald-500 flex-shrink-0" />;
  }
  if (a.includes('foto') || a.includes('film') || a.includes('video') || a.includes('audiovisual')) {
    return <Icons.Camera className="w-4 h-4 text-sky-500 flex-shrink-0" />;
  }
  if (
    a.includes('ave') ||
    a.includes('fauna') ||
    a.includes('flora') ||
    a.includes('observ') ||
    a.includes('paisaje')
  ) {
    return <Icons.Trees className="w-4 h-4 text-teal-500 flex-shrink-0" />;
  }
  if (
    a.includes('bote') ||
    a.includes('canoa') ||
    a.includes('pesca') ||
    a.includes('kayak') ||
    a.includes('rio') ||
    a.includes('agua') ||
    a.includes('mar') ||
    a.includes('natacion') ||
    a.includes('termal')
  ) {
    return <Icons.Waves className="w-4 h-4 text-cyan-500 flex-shrink-0" />;
  }
  if (a.includes('camp') || a.includes('camping')) {
    return <Icons.Trees className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  }
  if (a.includes('artesan') || a.includes('compra') || a.includes('mercado') || a.includes('souvenir')) {
    return <Icons.Award className="w-4 h-4 text-amber-500 flex-shrink-0" />;
  }
  if (a.includes('estudio') || a.includes('investig') || a.includes('cientif') || a.includes('arqueol')) {
    return <Icons.Database className="w-4 h-4 text-indigo-500 flex-shrink-0" />;
  }
  if (
    a.includes('ritual') ||
    a.includes('mistic') ||
    a.includes('tradicion') ||
    a.includes('folclor') ||
    a.includes('danza') ||
    a.includes('fiesta') ||
    a.includes('cultura')
  ) {
    return <Icons.Sparkles className="w-4 h-4 text-rose-500 flex-shrink-0" />;
  }
  return <Icons.Compass className="w-4 h-4 text-sky-500 flex-shrink-0" />;
};

function SmallActivityIcon({ url, name }: { url?: string; name: string }) {
  const [hasError, setHasError] = useState(!url);

  if (hasError || !url) {
    return (
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        {getActivityIcon(name)}
      </div>
    );
  }

  return (
    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
      <img
        src={url}
        alt={name}
        className="w-full h-full object-contain"
        loading="lazy"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

const getTransportIcon = (transport: string) => {
  const t = (transport || '').toLowerCase();
  if (t.includes('pie') || t.includes('caminata')) {
    return <Icons.Footprints className="w-4 h-4 text-emerald-500" />;
  }
  if (t.includes('bus') || t.includes('combi') || t.includes('colectivo') || t.includes('minivan')) {
    return <Icons.Bus className="w-4 h-4 text-sky-500" />;
  }
  if (t.includes('bote') || t.includes('lancha') || t.includes('canoa') || t.includes('fluvial') || t.includes('maritimo')) {
    return <Icons.Waves className="w-4 h-4 text-cyan-500" />;
  }
  return <Icons.Car className="w-4 h-4 text-amber-500" />;
};

function parseRutasList(ficha: FichaDetail | null): FichaRutaAcceso[] {
  if (ficha?.rutas_acceso && ficha.rutas_acceso.length > 0) {
    return ficha.rutas_acceso;
  }

  const rawSection = ficha?.secciones?.find((s) => {
    const t = s.titulo.toLowerCase();
    return t.includes('ruta de acceso') || t.includes('acceso');
  });

  if (!rawSection || !rawSection.contenido_texto) return [];

  const text = rawSection.contenido_texto
    .replace(/^Recorrido\s+Tramo\s+Detalle\s+Tipo de Acceso\s+Medio de transporte\s+Tipo de V[íi]a(?:\s+Terrestre)?\s+Distancia en kms\.\/tiempo\s*/i, '')
    .trim();

  const tramoRegex = /(\d+)\s+([^\d]+?)\s+(Terrestre|Fluvial|Marítimo|Aéreo|Lacustre)\s+([^\d]+?)\s+(Trocha carrozable|Asfaltado|Afirmado|Sendero|Camino de herradura|Sin vía|Pavimentado|Río|Lago|Mar|[A-Za-z\s]+?)\s+(\d+[\d\s\.,\w\/\-]+?(?:km|horas?|minutos?|días?|m\b|\.|$))/gi;

  const results: FichaRutaAcceso[] = [];
  let match;

  while ((match = tramoRegex.exec(text)) !== null) {
    results.push({
      tramo: match[2]?.trim() || `Tramo ${match[1]}`,
      detalle: match[2]?.trim() || '',
      tipo_acceso: match[3]?.trim(),
      medio_transporte: match[4]?.trim(),
      tipo_via: match[5]?.trim(),
      distancia_tiempo: match[6]?.trim(),
    });
  }

  if (results.length > 0) return results;

  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines) {
    results.push({
      tramo: line,
      detalle: line,
    });
  }

  return results;
}

function parseEpocaList(ficha: FichaDetail | null): FichaEpocaPropicia[] {
  if (ficha?.epoca_propicia && ficha.epoca_propicia.length > 0) {
    return ficha.epoca_propicia;
  }

  const rawSection = ficha?.secciones?.find((s) => {
    const t = s.titulo.toLowerCase();
    return t.includes('epoca propicia') || t.includes('época propicia');
  });

  if (!rawSection || !rawSection.contenido_texto) return [];

  const text = rawSection.contenido_texto;
  const epocaMatch = text.match(/Época propicia de visita\s*:\s*([^\n]+)/i);
  const espMatch = text.match(/Especificación\s*:\s*([^\n]+)/i);
  const horMatch = text.match(/Horario de visita\s*:\s*([^\n]+)/i);
  const obsMatch = text.match(/Observaciones\s*:\s*([^\n]+)/i);

  if (epocaMatch || horMatch) {
    return [
      {
        epoca: epocaMatch ? epocaMatch[1].trim() : 'Todo el Año',
        especificacion: espMatch ? espMatch[1].trim() : '',
        horario: horMatch ? horMatch[1].trim() : '08:00 a.m. - 05:00 p.m.',
        observaciones: obsMatch ? obsMatch[1].trim() : '',
      },
    ];
  }

  return [
    {
      epoca: 'Todo el Año',
      especificacion: '',
      horario: text.trim() || '08:00 a.m. - 05:00 p.m.',
      observaciones: '',
    },
  ];
}

function cleanLabel(text: string | null | undefined): string {
  if (!text) return '';
  let cleaned = text
    .replace(/^[0-9a-zA-Z]{1,3}[\.\)\-]\s*/, '')
    .replace(/^[\.\-\/\s]+/, '')
    .trim();

  if (!cleaned) cleaned = text.trim();

  const prepositions = ['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'e', 'o', 'u', 'por', 'con', 'al'];
  return cleaned
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function cleanAltitud(altitud: string | null | undefined): string {
  if (!altitud || altitud.trim() === '--' || altitud.trim() === '') return 'No especificada';
  const val = altitud.trim();
  if (val.toLowerCase().includes('m.s.n.m') || val.toLowerCase().includes('msnm') || val.toLowerCase().includes('metros')) {
    return val;
  }
  if (!isNaN(Number(val))) {
    return `${Number(val).toLocaleString()} m.s.n.m.`;
  }
  return `${val} m.s.n.m.`;
}

interface FichaTurismoPageProps {
  params?: { slug?: string };
}

function FichaTurismoContent({ params }: FichaTurismoPageProps) {
  const { t } = useLanguage();
  const routeParams = useParams();
  const router = useTransitionRouter();
  const rawSlug = params?.slug || routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || '');
  const codFicha = extractCodeFromSlug(slug);

  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

  const allPhotos = useMemo(() => {
    const list: string[] = [];
    if (ficha?.galeria_fotos && ficha.galeria_fotos.length > 0) {
      list.push(...ficha.galeria_fotos);
    } else if (ficha?.foto_principal) {
      list.push(ficha.foto_principal);
    } else if (codFicha) {
      list.push(getPhotoUrl(codFicha));
    }
    return list;
  }, [ficha, codFicha]);

  const currentPhoto = allPhotos[activePhotoIndex] || allPhotos[0] || (codFicha ? getPhotoUrl(codFicha) : '');

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

  // Atajos de teclado para el visor a pantalla completa
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') {
        setActivePhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
        setImgError(false);
      }
      if (e.key === 'ArrowRight') {
        setActivePhotoIndex((prev) => (prev + 1) % allPhotos.length);
        setImgError(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [isLightboxOpen, allPhotos.length]);

  // Actualizar el título de la página dinámicamente según la ficha oficial
  useEffect(() => {
    if (ficha?.nombre) {
      const dpto = ficha.departamento ? ` (${cleanLabel(ficha.departamento)})` : '';
      document.title = `${cleanLabel(ficha.nombre)}${dpto} | Ficha Oficial | OpenData Perú`;
    }
  }, [ficha]);

  useEffect(() => {
    if (!codFicha) {
      setError('Código de ficha no válido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    apiService
      .getFichaDetail(codFicha)
      .then((data: FichaDetail | null) => {
        setFicha(data);
        setActivePhotoIndex(0);
        setImgError(false);
      })
      .catch((err: unknown) => {
        console.error('Error al cargar la ficha:', err);
        setError('Esta ficha no existe o ha sido dada de baja del inventario.');
      })
      .finally(() => setLoading(false));
  }, [codFicha]);

  const extractYouTubeEmbed = () => {
    if (ficha?.youtube_embed_url) return ficha.youtube_embed_url;
    if (ficha?.youtube_id) return `https://www.youtube.com/embed/${ficha.youtube_id}`;

    if (ficha?.secciones) {
      const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
      for (const sec of ficha.secciones) {
        const match = sec.contenido_html?.match(ytRegex);
        if (match && match[1]) {
          return `https://www.youtube.com/embed/${match[1]}`;
        }
      }
    }
    return null;
  };

  const youtubeEmbedUrl = extractYouTubeEmbed();
  const rutasAcceso = useMemo(() => parseRutasList(ficha), [ficha]);
  const epocaPropicia = useMemo(() => parseEpocaList(ficha), [ficha]);

  const descriptionParagraphs = useMemo(() => {
    if (!ficha?.descripcion) return [];
    let cleanDesc = ficha.descripcion.trim();
    const half = Math.floor(cleanDesc.length / 2);
    if (cleanDesc.length > 100 && cleanDesc.substring(0, half).trim() === cleanDesc.substring(half).trim()) {
      cleanDesc = cleanDesc.substring(0, half).trim();
    }
    const paragraphs = cleanDesc
      .split(/(?<=\.\s+)(?=[A-ZÁÉÍÓÚ])/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const uniqueParagraphs: string[] = [];
    for (const p of paragraphs) {
      if (!uniqueParagraphs.some((existing) => existing === p || existing.includes(p) || p.includes(existing))) {
        uniqueParagraphs.push(p);
      }
    }
    return uniqueParagraphs.length > 0 ? uniqueParagraphs : paragraphs;
  }, [ficha?.descripcion]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyCoords = (coords: string) => {
    navigator.clipboard.writeText(coords);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const googleMapsLink =
    ficha?.google_maps_url ||
    (ficha?.x && ficha?.y
      ? `https://www.google.com/maps?q=${ficha.y},${ficha.x}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${ficha?.nombre || ''}, ${ficha?.distrito ? ficha.distrito + ', ' : ''}${ficha?.provincia ? ficha.provincia + ', ' : ''}${ficha?.departamento ? ficha.departamento + ', ' : ''}Peru`
        )}`);

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
              <span>{t('ficha.breadcrumbHome')}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/turismo" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors font-medium">
              {t('ficha.breadcrumbTurismo')}
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[200px] sm:max-w-md">
              {ficha?.nombre || `${t('card.recordNum')} #${codFicha}`}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('ficha.copied')}</span>
                </>
              ) : (
                <>
                  <Icons.Share className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t('ficha.share')}</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>{t('ficha.backToCatalog')}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-36 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t('ficha.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-24 text-center max-w-lg mx-auto p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs">
            <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Icons.Info className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('ficha.notFound')}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{t('ficha.notFoundDesc')}</p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs transition-colors shadow-xs"
            >
              {t('ficha.exploreOther')}
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ENCABEZADO INSTITUCIONAL DE LA FICHA */}
        {/* ========================================================================= */}
        {!loading && ficha && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header del recurso turístico */}
            <div className="space-y-3">
              {/* Badges de Metadatos Oficiales y Verificación */}
              <div className="flex flex-wrap items-center gap-2">
                <OfficialBadge variant="code">
                  {t('card.recordNum')} #{ficha.cod_ficha}
                </OfficialBadge>
                {ficha.categoria && (
                  <span className="gov-badge-code">
                    <DynamicText text={cleanLabel(ficha.categoria)} />
                  </span>
                )}
                {ficha.altitud && ficha.altitud !== '--' && (
                  <span className="gov-badge-code">
                    🏔️ {cleanAltitud(ficha.altitud)}
                  </span>
                )}
                <TrustVerificationBadge source="MINCETUR" date="25/09/2026" />
              </div>

              {/* Título Principal */}
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                {ficha.nombre}
              </h1>

              {/* Barra de Ubicación Geográfica Oficial */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <Icons.MapPin className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">{ficha.departamento}</strong>
                    {ficha.provincia && <span> • {ficha.provincia}</span>}
                    {ficha.distrito && <span> • {ficha.distrito}</span>}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3B60] dark:text-slate-300 hover:underline"
                  >
                    <span>{t('ficha.viewOnMap')}</span>
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {ficha.url_ficha && (
                    <a
                      href={ficha.url_ficha}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3B60] dark:text-slate-300 hover:underline ml-2"
                    >
                      <span>{t('ficha.sourceFile')}</span>
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
                className="relative w-full h-[340px] sm:h-[480px] lg:h-[520px] rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-card border border-slate-200 dark:border-slate-800 flex items-center justify-center cursor-pointer group"
              >
                <InstitutionalImage
                  src={currentPhoto ? formatPhotoUrl(currentPhoto, ficha.cod_ficha) : undefined}
                  alt={ficha.nombre}
                  category={ficha.categoria || 'Recurso Turístico'}
                  code={ficha.cod_ficha}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                {/* Botón Ver Pantalla Completa Superior Derecho */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLightbox(activePhotoIndex);
                  }}
                  className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md border border-white/20 hover:border-white/40 shadow-xs transition-all cursor-pointer"
                >
                  <Icons.Maximize className="w-3.5 h-3.5 text-white" />
                  <span>{t('ficha.fullscreen')}</span>
                </button>

                {/* Flechas de cambio de imagen directa tipo Slide */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevPhoto}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-md bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 hover:border-white/40 transition-all shadow-xs cursor-pointer"
                      aria-label="Foto anterior"
                    >
                      <Icons.ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextPhoto}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 z-10 p-2 sm:p-2.5 rounded-md bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md border border-white/15 hover:border-white/40 transition-all shadow-xs cursor-pointer"
                      aria-label="Siguiente foto"
                    >
                      <Icons.ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </>
                )}

                {/* Subtítulo integrado en la foto */}
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white text-xs pointer-events-none">
                  <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10">
                    <Icons.Camera className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-semibold">{t('ficha.officialPhoto')}</span>
                  </div>
                  {allPhotos.length > 1 && (
                    <span className="text-slate-200 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-white/10 font-mono text-[11px] font-semibold">
                      {activePhotoIndex + 1} / {allPhotos.length} {t('ficha.photos')}
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
                        onClick={() => {
                          setActivePhotoIndex(index);
                          setImgError(false);
                        }}
                        className={`relative w-24 sm:w-28 h-16 sm:h-20 rounded-md overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-[#0B3B60] ring-1 ring-[#0B3B60]'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <InstitutionalImage
                          src={formatPhotoUrl(photo, ficha.cod_ficha)}
                          alt=""
                          category={ficha.categoria || 'Recurso Turístico'}
                          className="w-full h-full object-cover"
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
                    <span className="text-sm font-bold text-sky-400 truncate max-w-md">
                      {ficha.nombre}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      • {cleanLabel(ficha.departamento)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-white/10 border border-white/10 text-slate-200">
                      Foto {activePhotoIndex + 1} de {allPhotos.length}
                    </span>
                    <button
                      onClick={closeLightbox}
                      className="p-2 rounded-lg bg-white/10 hover:bg-rose-500/20 hover:text-rose-400 text-white transition-colors cursor-pointer"
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
                      onClick={handlePrevPhoto}
                      className="absolute left-2 sm:left-4 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 hover:border-sky-400/60 shadow-2xl transition-all hover:scale-105 cursor-pointer"
                      title="Foto anterior (Flecha Izquierda)"
                    >
                      <Icons.ChevronLeft className="w-6 h-6 text-white" />
                    </button>
                  )}

                  <div className="relative max-h-[75vh] max-w-[90vw] flex items-center justify-center">
                    <img
                      src={formatPhotoUrl(currentPhoto, ficha.cod_ficha)}
                      alt={ficha.nombre}
                      className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all duration-300"
                    />
                  </div>

                  {allPhotos.length > 1 && (
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-2 sm:right-4 z-20 p-3 sm:p-4 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 hover:border-sky-400/60 shadow-2xl transition-all hover:scale-105 cursor-pointer"
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
                        onClick={() => {
                          setActivePhotoIndex(idx);
                          setImgError(false);
                        }}
                        className={`relative w-16 sm:w-20 h-11 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          activePhotoIndex === idx
                            ? 'border-sky-500 ring-2 ring-sky-400/50 scale-105'
                            : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={formatPhotoUrl(photo, ficha.cod_ficha)}
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
                {/* 1. Descripción Editorial */}
                {descriptionParagraphs.length > 0 && (
                  <section className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <Icons.Info className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                        {t('ficha.officialDescription')}
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
                            <DynamicText text={paragraph} />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 2. Ruta de Acceso como TIMELINE ITINERARIO */}
                {rutasAcceso.length > 0 && (
                  <section className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Icons.Navigation className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                          {t('ficha.howToGet')}
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {rutasAcceso.length} tramos
                      </span>
                    </div>

                    {/* Timeline Vertical */}
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6 my-4 ml-3">
                      {rutasAcceso.map((ruta, idx) => (
                        <div key={idx} className="relative group">
                          {/* Nodo circular en la línea del timeline */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-[#0B3B60] text-[#0B3B60] dark:text-slate-300 font-bold text-xs flex items-center justify-center shadow-xs group-hover:bg-[#0B3B60] group-hover:text-white transition-colors">
                            {idx + 1}
                          </div>

                          {/* Contenido del paso en tarjeta limpia */}
                          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                              <DynamicText text={ruta.detalle || ruta.tramo} />
                            </h3>

                            {ruta.detalle && ruta.tramo && ruta.detalle !== ruta.tramo && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                <DynamicText text={ruta.tramo} />
                              </p>
                            )}

                            {/* Tags compactos de transporte y distancia */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {ruta.medio_transporte && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/60 shadow-xs">
                                  {getTransportIcon(ruta.medio_transporte)}
                                  <DynamicText text={ruta.medio_transporte} />
                                </span>
                              )}

                              {ruta.tipo_via && (
                                <span className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700/60 shadow-xs">
                                  <DynamicText text={ruta.tipo_via} />
                                </span>
                              )}

                              {ruta.distancia_tiempo && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold border border-slate-300 dark:border-slate-700">
                                  <Icons.Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <DynamicText text={ruta.distancia_tiempo} />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* 3. Reproductor de Video Oficial (si existe) */}
                {youtubeEmbedUrl && (
                  <section className="p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
                      <h2 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                        {t('ficha.liveVideo')}
                      </h2>
                    </div>
                    <div className="w-full aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-xs">
                      <iframe
                        src={youtubeEmbedUrl}
                        title={`Video de ${ficha.nombre}`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </section>
                )}
              </div>

              {/* COLUMNA DERECHA: INSPECTOR TÉCNICO STICKY (4 COLUMNAS) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                {/* 1. Panel Técnico de Especificaciones */}
                <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Icons.Layers className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                      <span>{t('ficha.techSpecs')}</span>
                    </span>
                    <OfficialBadge variant="code">
                      OFICIAL
                    </OfficialBadge>
                  </div>

                  <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-0">
                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.category')}</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {ficha.categoria ? <DynamicText text={cleanLabel(ficha.categoria)} /> : t('ficha.notSpecified')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.type')}</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {ficha.tipo ? <DynamicText text={cleanLabel(ficha.tipo)} /> : t('ficha.notSpecifiedMale')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.subtype')}</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right">
                        {ficha.subtipo ? <DynamicText text={cleanLabel(ficha.subtipo)} /> : t('ficha.notSpecifiedMale')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.altitude')}</dt>
                      <dd className="font-semibold text-slate-900 dark:text-white text-right font-mono">
                        {cleanAltitud(ficha.altitud)}
                      </dd>
                    </div>

                    {ficha.x && ficha.y && (
                      <div className="py-2.5 flex justify-between items-center gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Coordenadas</dt>
                        <dd className="text-right">
                          <button
                            onClick={() => handleCopyCoords(`${ficha.y}, ${ficha.x}`)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0B3B60] dark:hover:text-white transition-colors cursor-pointer"
                            title="Copiar coordenadas"
                          >
                            <span>
                              {!isNaN(Number(ficha.y)) && !isNaN(Number(ficha.x))
                                ? `${Number(ficha.y).toFixed(4)}, ${Number(ficha.x).toFixed(4)}`
                                : `${ficha.y}, ${ficha.x}`}
                            </span>
                            {copiedCoords ? (
                              <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
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
                      <span>{t('ficha.viewOnMap')}</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                </div>

                {/* Banner Display 300x250 MPU en Sidebar */}
                <AdsterraDisplayBanner size="300x250" className="my-2" />

                {/* 2. Época Propicia y Horarios */}
                {epocaPropicia.length > 0 && (
                  <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                        <span>{t('ficha.seasonAndHours')}</span>
                      </span>
                    </div>

                    {epocaPropicia.map((ep, idx) => (
                      <div key={idx} className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                            {t('ficha.recommendedSeason')}
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">
                            <DynamicText text={cleanLabel(ep.epoca) || 'Todo el Año'} />
                          </p>
                          {ep.especificacion && ep.especificacion !== '--' && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <DynamicText text={ep.especificacion} />
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                            {t('ficha.visitingHours')}
                          </span>
                          <p className="font-semibold text-slate-900 dark:text-white font-mono">
                            {ep.horario || '08:00 a.m. - 05:00 p.m.'}
                          </p>
                        </div>

                        {ep.observaciones && (
                          <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                            <span className="font-bold block mb-1">Recomendación:</span>
                            <p className="leading-relaxed">
                              <DynamicText text={ep.observaciones} />
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 3. Actividades Permitidas */}
                {((ficha.actividades_detalle && ficha.actividades_detalle.length > 0) ||
                  (ficha.actividades_permitidas && ficha.actividades_permitidas.length > 0)) && (
                  <div className="p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icons.Compass className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
                        <span>{t('ficha.activitiesInResource')}</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {(ficha.actividades_detalle || ficha.actividades_permitidas).length}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {ficha.actividades_detalle && ficha.actividades_detalle.length > 0
                        ? ficha.actividades_detalle.map((act, idx) => {
                            const actName = act.tipo || act.actividad;
                            return (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-colors shadow-xs"
                              >
                                <SmallActivityIcon url={act.icono_url} name={actName} />
                                <span>
                                  <DynamicText text={actName} />
                                </span>
                              </div>
                            );
                          })
                        : ficha.actividades_permitidas.map((act, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-slate-400 transition-colors shadow-xs"
                            >
                              <SmallActivityIcon name={act} />
                              <span>
                                <DynamicText text={act} />
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Anuncio Nativo Adsterra Estratégico */}
            <AdsterraNativeBanner className="mt-8 mb-4" />
          </div>
        )}
      </div>
    </main>
  );
}

export default function FichaTurismoPage(props: FichaTurismoPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-36">
          <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FichaTurismoContent {...props} />
    </Suspense>
  );
}
