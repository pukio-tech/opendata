'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiService, API_BASE_URL, getPhotoUrl } from '../../../services/api';
import { FichaDetail, FichaRutaAcceso, FichaEpocaPropicia } from '../../../types/mincetur';
import { extractCodeFromSlug } from '../../../utils/slug';
import { Icons } from '../../../components/Icons';
import { useLanguage } from '../../../context/LanguageContext';
import { DynamicText } from '../../../utils/dynamicTranslate';

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
  const router = useRouter();
  const rawSlug = params?.slug || routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug || '');
  const codFicha = extractCodeFromSlug(slug);

  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedCoords, setCopiedCoords] = useState<boolean>(false);

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
        if (data?.galeria_fotos?.length) {
          setSelectedPhoto(data.galeria_fotos[0]);
        } else if (data?.foto_principal) {
          setSelectedPhoto(data.foto_principal);
        } else {
          setSelectedPhoto(getPhotoUrl(codFicha));
        }
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
    <main className="flex-1 bg-white dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors duration-300 min-h-screen pb-28">
      {/* Top ambient glow */}
      <div className="w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-sky-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* ========================================================================= */}
        {/* 1. NAVEGACIÓN Y ACCIONES SUPERIORES (FLUIDO, SIN CARDS PESADAS) */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-amber-500 transition-colors flex items-center gap-1.5 font-medium">
              <Icons.Compass className="w-4 h-4" />
              <span>{t('ficha.breadcrumbHome')}</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/turismo" className="hover:text-amber-500 transition-colors font-medium">
              {t('ficha.breadcrumbTurismo')}
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[180px] sm:max-w-md">
              {ficha?.nombre || `${t('card.recordNum')} #${codFicha}`}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Icons.Share className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>{t('ficha.backToCatalog')}</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-36 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{t('ficha.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-24 text-center max-w-lg mx-auto p-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Icons.Info className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{t('ficha.notFound')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('ficha.notFoundDesc')}</p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              {t('ficha.exploreOther')}
            </Link>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. DISEÑO EDITORIAL FLUIDO DEL RECURSO TURÍSTICO (SIN ABUSO DE CARDS) */}
        {/* ========================================================================= */}
        {!loading && ficha && (
          <div className="mt-8 space-y-10 animate-fadeIn">
            {/* Encabezado Editorial Principal */}
            <div className="space-y-4">
              {/* Badges de Metadatos Oficiales */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {t('card.recordNum')} #{ficha.cod_ficha}
                </span>
                {ficha.categoria && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <DynamicText text={cleanLabel(ficha.categoria)} />
                  </span>
                )}
                {ficha.altitud && ficha.altitud !== '--' && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
                    🏔️ {cleanAltitud(ficha.altitud)}
                  </span>
                )}
              </div>

              {/* Título en Montserrat de Impacto */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                {ficha.nombre}
              </h1>

              {/* Barra de Ubicación Geográfica Oficial */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  <Icons.MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                  >
                    <span>{t('ficha.viewOnMap')}</span>
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  {ficha.url_ficha && (
                    <a
                      href={ficha.url_ficha}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline ml-2"
                    >
                      <span>{t('ficha.sourceFile')}</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 3. SHOWCASE FOTOGRÁFICO DE GRAN FORMATO (CINEMATOGRÁFICO) */}
            {/* ========================================================================= */}
            <div className="space-y-4">
              <div className="relative w-full h-[340px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                {selectedPhoto && !imgError ? (
                  <img
                    src={formatPhotoUrl(selectedPhoto, ficha.cod_ficha)}
                    alt={ficha.nombre}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="text-center p-8 flex flex-col items-center justify-center text-white">
                    <Icons.Camera className="w-16 h-16 text-slate-500 mb-3" />
                    <span className="text-sm font-semibold text-slate-300">{t('card.noPhoto')}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Subtítulo integrado en la foto */}
                <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                    <Icons.Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold">Fotografía Oficial MINCETUR</span>
                  </div>
                  {ficha.galeria_fotos && ficha.galeria_fotos.length > 1 && (
                    <span className="text-slate-300 bg-slate-950/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[11px]">
                      {ficha.galeria_fotos.length} fotos registradas
                    </span>
                  )}
                </div>
              </div>

              {/* Tira de Miniaturas */}
              {ficha.galeria_fotos && ficha.galeria_fotos.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-thin">
                  {ficha.galeria_fotos.map((photo, index) => {
                    const isCurrent = selectedPhoto === photo;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedPhoto(photo);
                          setImgError(false);
                        }}
                        className={`relative w-24 sm:w-28 h-16 sm:h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                          isCurrent
                            ? 'border-amber-500 ring-2 ring-amber-400/40 scale-105 shadow-md'
                            : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={formatPhotoUrl(photo, ficha.cod_ficha)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ========================================================================= */}
            {/* 4. DISTRIBUCIÓN EDITORIAL EN 2 COLUMNAS (CONTENIDO NARRATIVO + PANEL TÉCNICO) */}
            {/* ========================================================================= */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* COLUMNA IZQUIERDA: FLUJO NARRATIVO EDITORIAL (7 COLUMNAS) */}
              <div className="lg:col-span-8 space-y-10">
                {/* 1. Descripción Editorial */}
                {descriptionParagraphs.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <Icons.Info className="w-5 h-5 text-amber-500" />
                      <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        {t('ficha.officialDescription')}
                      </h2>
                    </div>

                    <div className="space-y-4 pt-2">
                      {descriptionParagraphs.map((paragraph, pIdx) => {
                        const isLead = pIdx === 0;
                        return (
                          <div
                            key={pIdx}
                            className={
                              isLead
                                ? 'text-base sm:text-lg text-slate-800 dark:text-slate-200 leading-relaxed font-normal border-l-4 border-amber-500 pl-4 sm:pl-5'
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

                {/* 2. Ruta de Acceso como TIMELINE ITINERARIO (No cards pesadas) */}
                {rutasAcceso.length > 0 && (
                  <section className="space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Icons.Navigation className="w-5 h-5 text-sky-500" />
                        <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                          {t('ficha.howToGet')}
                        </h2>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {rutasAcceso.length} tramos
                      </span>
                    </div>

                    {/* Timeline Vertical */}
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-8 my-4 ml-3">
                      {rutasAcceso.map((ruta, idx) => (
                        <div key={idx} className="relative group">
                          {/* Nodo circular en la línea del timeline */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-amber-500 text-amber-500 dark:text-amber-400 font-bold text-xs flex items-center justify-center shadow-sm group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                            {idx + 1}
                          </div>

                          {/* Contenido del paso */}
                          <div className="space-y-2">
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
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
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700/60">
                                  {getTransportIcon(ruta.medio_transporte)}
                                  <DynamicText text={ruta.medio_transporte} />
                                </span>
                              )}

                              {ruta.tipo_via && (
                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700/60">
                                  <DynamicText text={ruta.tipo_via} />
                                </span>
                              )}

                              {ruta.distancia_tiempo && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-500/20">
                                  <Icons.Clock className="w-3.5 h-3.5 text-amber-500" />
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
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                        {t('ficha.liveVideo')}
                      </h2>
                    </div>
                    <div className="w-full aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-xl">
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
                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Icons.Layers className="w-4 h-4 text-sky-500" />
                      <span>{t('ficha.techSpecs')}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                      MINCETUR
                    </span>
                  </div>

                  <dl className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs space-y-0">
                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.category')}</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">
                        {ficha.categoria ? <DynamicText text={cleanLabel(ficha.categoria)} /> : t('ficha.notSpecified')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.type')}</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">
                        {ficha.tipo ? <DynamicText text={cleanLabel(ficha.tipo)} /> : t('ficha.notSpecifiedMale')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.subtype')}</dt>
                      <dd className="font-bold text-slate-900 dark:text-white text-right">
                        {ficha.subtipo ? <DynamicText text={cleanLabel(ficha.subtipo)} /> : t('ficha.notSpecifiedMale')}
                      </dd>
                    </div>

                    <div className="py-2.5 flex justify-between gap-3">
                      <dt className="text-slate-500 dark:text-slate-400">{t('ficha.altitude')}</dt>
                      <dd className="font-bold text-sky-600 dark:text-sky-400 text-right">
                        {cleanAltitud(ficha.altitud)}
                      </dd>
                    </div>

                    {ficha.x && ficha.y && (
                      <div className="py-2.5 flex justify-between items-center gap-3">
                        <dt className="text-slate-500 dark:text-slate-400">Coordenadas</dt>
                        <dd className="text-right">
                          <button
                            onClick={() => handleCopyCoords(`${ficha.y}, ${ficha.x}`)}
                            className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
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
                      className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Icons.MapPin className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span>{t('ficha.viewOnMap')}</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                </div>

                {/* 2. Época Propicia y Horarios */}
                {epocaPropicia.length > 0 && (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-amber-500" />
                        <span>{t('ficha.seasonAndHours')}</span>
                      </span>
                    </div>

                    {epocaPropicia.map((ep, idx) => (
                      <div key={idx} className="space-y-3 text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                            {t('ficha.recommendedSeason')}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            <DynamicText text={cleanLabel(ep.epoca) || 'Todo el Año'} />
                          </p>
                          {ep.especificacion && ep.especificacion !== '--' && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <DynamicText text={ep.especificacion} />
                            </p>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block mb-0.5">
                            {t('ficha.visitingHours')}
                          </span>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {ep.horario || '08:00 a.m. - 05:00 p.m.'}
                          </p>
                        </div>

                        {ep.observaciones && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 text-xs">
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

                {/* 3. Actividades Permitidas (Etiquetas / Pills fluidas en vez de cards) */}
                {((ficha.actividades_detalle && ficha.actividades_detalle.length > 0) ||
                  (ficha.actividades_permitidas && ficha.actividades_permitidas.length > 0)) && (
                  <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/90 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icons.Compass className="w-4 h-4 text-emerald-500" />
                        <span>{t('ficha.activitiesInResource')}</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-amber-400 transition-colors shadow-sm"
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-amber-400 transition-colors shadow-sm"
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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#070b14] py-36">
          <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FichaTurismoContent {...props} />
    </Suspense>
  );
}
