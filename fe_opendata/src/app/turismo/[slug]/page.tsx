'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiService, API_BASE_URL } from '../../../services/api';
import { FichaDetail, FichaRutaAcceso, FichaEpocaPropicia } from '../../../types/mincetur';
import { extractCodeFromSlug } from '../../../utils/slug';
import { Icons } from '../../../components/Icons';
import { useLanguage } from '../../../context/LanguageContext';
import { translateMinceturText } from '../../../utils/minceturTranslate';
import { DynamicText } from '../../../utils/dynamicTranslate';

const formatPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}${url}`;
};

const getActivityIcon = (actName: string) => {
  const a = (actName || '').toLowerCase();
  if (a.includes('caminata') || a.includes('trekking') || a.includes('senderismo') || a.includes('escalada') || a.includes('ciclismo')) {
    return <Icons.Footprints className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
  }
  if (a.includes('foto') || a.includes('film') || a.includes('video') || a.includes('audiovisual')) {
    return <Icons.Camera className="w-4 h-4 text-sky-600 flex-shrink-0" />;
  }
  if (a.includes('ave') || a.includes('fauna') || a.includes('flora') || a.includes('observ') || a.includes('paisaje')) {
    return <Icons.Trees className="w-4 h-4 text-teal-600 flex-shrink-0" />;
  }
  if (a.includes('bote') || a.includes('canoa') || a.includes('pesca') || a.includes('kayak') || a.includes('rio') || a.includes('agua') || a.includes('mar') || a.includes('natacion') || a.includes('termal')) {
    return <Icons.Waves className="w-4 h-4 text-cyan-600 flex-shrink-0" />;
  }
  if (a.includes('camp') || a.includes('camping')) {
    return <Icons.Trees className="w-4 h-4 text-amber-600 flex-shrink-0" />;
  }
  if (a.includes('artesan') || a.includes('compra') || a.includes('mercado') || a.includes('souvenir')) {
    return <Icons.Award className="w-4 h-4 text-amber-600 flex-shrink-0" />;
  }
  if (a.includes('estudio') || a.includes('investig') || a.includes('cientif') || a.includes('arqueol')) {
    return <Icons.Database className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
  }
  if (a.includes('ritual') || a.includes('mistic') || a.includes('tradicion') || a.includes('folclor') || a.includes('danza') || a.includes('fiesta') || a.includes('cultura')) {
    return <Icons.Sparkles className="w-4 h-4 text-rose-600 flex-shrink-0" />;
  }
  return <Icons.Compass className="w-4 h-4 text-sky-600 flex-shrink-0" />;
};

function SmallActivityIcon({ url, name }: { url?: string; name: string }) {
  const [hasError, setHasError] = useState(!url);

  if (hasError || !url) {
    return (
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {getActivityIcon(name)}
      </div>
    );
  }

  return (
    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
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
    return <Icons.Footprints className="w-4 h-4 text-emerald-600" />;
  }
  if (t.includes('bus') || t.includes('combi') || t.includes('colectivo') || t.includes('minivan')) {
    return <Icons.Bus className="w-4 h-4 text-sky-600" />;
  }
  if (t.includes('bote') || t.includes('lancha') || t.includes('canoa') || t.includes('fluvial') || t.includes('maritimo')) {
    return <Icons.Waves className="w-4 h-4 text-cyan-600" />;
  }
  return <Icons.Car className="w-4 h-4 text-amber-600" />;
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

export default function FichaTurismoPage() {
  const { language, t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const slug = (params?.slug as string) || '';
  const codFicha = extractCodeFromSlug(slug);

  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

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

  const otherSections = (ficha?.secciones || []).filter((sec) => {
    const title = sec.titulo.toLowerCase();
    return (
      !title.includes('descrip') &&
      !title.includes('ruta de acceso') &&
      !title.includes('acceso') &&
      !title.includes('epoca propicia') &&
      !title.includes('época propicia') &&
      !title.includes('actividad') &&
      !title.includes('responsable')
    );
  });

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

  return (
    <main className="flex-1 bg-white text-slate-900 min-h-screen pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
            <Link href="/" className="hover:text-amber-600 transition-colors flex items-center gap-1.5">
              <Icons.Compass className="w-4 h-4" />
              <span>{t('ficha.breadcrumbHome')}</span>
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/turismo" className="hover:text-sky-600 transition-colors">
              {t('ficha.breadcrumbTurismo')}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-800 font-semibold truncate max-w-[200px] sm:max-w-md">
              {ficha?.nombre || `${t('card.recordNum')} #${codFicha}`}
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-sm cursor-pointer"
          >
            <Icons.ChevronRight className="w-4 h-4 rotate-180" />
            <span>{t('ficha.backToCatalog')}</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-32 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-3xl border border-slate-200">
            <div className="w-12 h-12 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-600">{t('ficha.loading')}</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-24 text-center bg-slate-50 rounded-3xl border border-rose-200 p-8">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
              <Icons.Info className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{t('ficha.notFound')}</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              {t('ficha.notFoundDesc')}
            </p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md hover:brightness-105 transition-all"
            >
              {t('ficha.exploreOther')}
            </Link>
          </div>
        )}

        {/* Resource Main Content */}
        {!loading && ficha && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Card */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 p-6 sm:p-10 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                    {ficha.nombre}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 mt-2 sm:mt-3">
                    <Icons.MapPin className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>
                      {ficha.departamento} &gt; {ficha.provincia} &gt; {ficha.distrito}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {t('card.recordNum')} #{ficha.cod_ficha}
                    </span>
                    {ficha.categoria && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        <DynamicText text={cleanLabel(ficha.categoria)} />
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={ficha.url_ficha}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <span>{t('ficha.sourceFile')}</span>
                    <Icons.ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Photo Showcase & Key Specs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Photo Showcase (Col 2) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-md p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <Icons.Camera className="w-4 h-4 text-sky-600" />
                    <span>{t('ficha.officialPhoto')}</span>
                  </h3>

                  {/* Main Image Container */}
                  <div className="relative w-full h-80 sm:h-[440px] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                    {selectedPhoto && !imgError ? (
                      <img
                        src={formatPhotoUrl(selectedPhoto)}
                        alt={ficha.nombre}
                        className="w-full h-full object-cover transition-opacity duration-300"
                        loading="eager"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="text-center p-8 flex flex-col items-center justify-center">
                        <Icons.Camera className="w-12 h-12 text-slate-400 mb-2" />
                        <span className="text-xs font-medium text-slate-500">{t('card.noPhoto')}</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails Row */}
                  {ficha.galeria_fotos && ficha.galeria_fotos.length > 1 && (
                    <div className="mt-6 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                        {t('ficha.officialGallery')} ({ficha.galeria_fotos.length} {t('ficha.photos')})
                      </span>
                      <div className="flex items-center gap-3.5 overflow-x-auto py-3 px-1.5 scrollbar-thin">
                        {ficha.galeria_fotos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setImgError(false);
                            }}
                            className={`relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                              selectedPhoto === photo
                                ? 'border-amber-500 ring-2 ring-amber-400/50 opacity-100 scale-105 shadow-md z-10'
                                : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                            }`}
                          >
                            <img src={formatPhotoUrl(photo)} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Descripción en Párrafos Estructurados y Legibles */}
                {descriptionParagraphs.length > 0 && (
                  <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700 flex items-center gap-2">
                        <Icons.Info className="w-4 h-4 text-amber-600" />
                        <span>{t('ficha.officialDescription')}</span>
                      </h2>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {t('ficha.minceturInventory')}
                      </span>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {descriptionParagraphs.map((paragraph, pIdx) => (
                        <p key={pIdx} className="text-slate-700 leading-relaxed">
                          <DynamicText text={paragraph} />
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Specifications (Col 1) */}
              <div className="space-y-6">
                {/* Classification Box */}
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700 flex items-center gap-2">
                    <Icons.Layers className="w-4 h-4 text-sky-600" />
                    <span>{t('ficha.techSpecs')}</span>
                  </h3>

                  <div className="space-y-3 divide-y divide-slate-200 text-xs">
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-500">{t('ficha.category')}</span>
                      <span className="font-bold text-slate-900 text-right">
                        {ficha.categoria ? <DynamicText text={cleanLabel(ficha.categoria)} /> : t('ficha.notSpecified')}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-500">{t('ficha.type')}</span>
                      <span className="font-bold text-slate-900 text-right">
                        {ficha.tipo ? <DynamicText text={cleanLabel(ficha.tipo)} /> : t('ficha.notSpecifiedMale')}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-500">{t('ficha.subtype')}</span>
                      <span className="font-bold text-slate-900 text-right">
                        {ficha.subtipo ? <DynamicText text={cleanLabel(ficha.subtipo)} /> : t('ficha.notSpecifiedMale')}
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-500">{t('ficha.altitude')}</span>
                      <span className="font-bold text-sky-700 text-right">{cleanAltitud(ficha.altitud)}</span>
                    </div>
                  </div>

                  {/* Enlace Oficial a Google Maps / Ubicación Georreferenciada */}
                  <div className="pt-2 border-t border-slate-200">
                    <a
                      href={
                        ficha.google_maps_url ||
                        (ficha.x && ficha.y
                          ? `https://www.google.com/maps?q=${ficha.y},${ficha.x}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${ficha.nombre}, ${ficha.distrito ? ficha.distrito + ', ' : ''}${ficha.provincia ? ficha.provincia + ', ' : ''}${ficha.departamento ? ficha.departamento + ', ' : ''}Peru`
                            )}`)
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Icons.MapPin className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span>{t('ficha.viewOnMap')}</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                </div>

                {/* Época Propicia de Visita y Horarios */}
                {epocaPropicia.length > 0 && (
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-amber-600" />
                        <span>{t('ficha.seasonAndHours')}</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {t('ficha.visit')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {epocaPropicia.map((ep, idx) => (
                        <div key={idx} className="space-y-3">
                          {/* Temporada */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block flex items-center gap-1.5">
                              <Icons.Sun className="w-3.5 h-3.5" />
                              {t('ficha.recommendedSeason')}
                            </span>
                            <p className="text-sm font-black text-slate-900">
                              <DynamicText text={cleanLabel(ep.epoca) || 'Todo el Año'} />
                            </p>
                            {ep.especificacion && ep.especificacion !== '--' && (
                              <p className="text-[11px] text-slate-600">
                                <DynamicText text={ep.especificacion} />
                              </p>
                            )}
                          </div>

                          {/* Horario */}
                          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
                            <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block flex items-center gap-1.5">
                              <Icons.Clock className="w-3.5 h-3.5" />
                              {t('ficha.visitingHours')}
                            </span>
                            <p className="text-sm font-black text-slate-900">
                              {ep.horario || '08:00 a.m. - 05:00 p.m.'}
                            </p>
                          </div>

                          {/* Recomendaciones */}
                          {ep.observaciones && (
                            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-sm">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-1.5">
                                <Icons.Shield className="w-3.5 h-3.5" />
                                {t('ficha.recommendations')}
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                <DynamicText text={ep.observaciones} />
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actividades Desarrolladas dentro del recurso turístico (Lista completa sin scroll) */}
                {((ficha.actividades_detalle && ficha.actividades_detalle.length > 0) ||
                  (ficha.actividades_permitidas && ficha.actividades_permitidas.length > 0)) && (
                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-md space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                        <Icons.Compass className="w-4 h-4 text-amber-600" />
                        <span>{t('ficha.activitiesInResource')}</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        {(ficha.actividades_detalle || ficha.actividades_permitidas).length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ficha.actividades_detalle && ficha.actividades_detalle.length > 0
                        ? ficha.actividades_detalle.map((act, idx) => {
                            const actName = act.tipo || act.actividad;
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                              >
                                <SmallActivityIcon url={act.icono_url} name={actName} />
                                <span className="text-xs font-medium text-slate-800 leading-snug" title={actName}>
                                  <DynamicText text={actName} />
                                </span>
                              </div>
                            );
                          })
                        : ficha.actividades_permitidas.map((act, idx) => {
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-sm"
                              >
                                <SmallActivityIcon name={act} />
                                <span className="text-xs font-medium text-slate-800 leading-snug" title={act}>
                                  <DynamicText text={act} />
                                </span>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Ruta de Acceso al Recurso (Paso a Paso Visual / Timeline Cards) */}
            {rutasAcceso.length > 0 && (
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Icons.Navigation className="w-5 h-5 text-sky-600" />
                      <span>{t('ficha.howToGet')}</span>
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      {t('ficha.howToGetDesc')}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 self-start sm:self-auto">
                    {rutasAcceso.length} {t('ficha.registeredSections')}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {rutasAcceso.map((ruta, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                    >
                      {/* Paso e Itinerario */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                            <DynamicText text={ruta.detalle || ruta.tramo} />
                          </h4>
                          {ruta.detalle && ruta.tramo && ruta.detalle !== ruta.tramo && (
                            <p className="text-[11px] text-slate-500">
                              <DynamicText text={ruta.tramo} />
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badges de Transporte, Vía y Distancia/Tiempo */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
                        {/* Medio de transporte */}
                        {ruta.medio_transporte && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium">
                            {getTransportIcon(ruta.medio_transporte)}
                            <DynamicText text={ruta.medio_transporte} />
                          </div>
                        )}

                        {/* Tipo de Vía */}
                        {ruta.tipo_via && (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
                            <DynamicText text={ruta.tipo_via} />
                          </div>
                        )}

                        {/* Distancia y Tiempo */}
                        {ruta.distancia_tiempo && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <Icons.Clock className="w-3.5 h-3.5 text-amber-600" />
                            <DynamicText text={ruta.distancia_tiempo} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Video Iframe Live Embed (Solo si existe recurso de video) */}
            {youtubeEmbedUrl && (
              <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-red-200 shadow-md space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <span>{t('ficha.liveVideo')}</span>
                  </h2>
                </div>
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-xl">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`Video de ${ficha.nombre}`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Otras Secciones Oficiales Adicionales (si existen) */}
            {otherSections.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Icons.Layers className="w-5 h-5 text-amber-600" />
                  <span>{t('ficha.additionalInfo')}</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherSections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-md space-y-3"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-sky-700 flex items-center gap-2">
                        <Icons.CheckCircle className="w-4 h-4 text-sky-600" />
                        <DynamicText text={sec.titulo} />
                      </h3>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        <DynamicText text={sec.contenido_texto} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
