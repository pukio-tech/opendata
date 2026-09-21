'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiService, API_BASE_URL } from '../../../services/api';
import { FichaDetail, FichaRutaAcceso, FichaEpocaPropicia } from '../../../types/mincetur';
import { extractCodeFromSlug } from '../../../utils/slug';
import { Icons } from '../../../components/Icons';

const formatPhotoUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}${url}`;
};

const getActivityIcon = (actName: string) => {
  const a = (actName || '').toLowerCase();
  if (a.includes('caminata') || a.includes('trekking') || a.includes('senderismo') || a.includes('escalada') || a.includes('ciclismo')) {
    return <Icons.Footprints className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  }
  if (a.includes('foto') || a.includes('film') || a.includes('video') || a.includes('audiovisual')) {
    return <Icons.Camera className="w-4 h-4 text-sky-400 flex-shrink-0" />;
  }
  if (a.includes('ave') || a.includes('fauna') || a.includes('flora') || a.includes('observ') || a.includes('paisaje')) {
    return <Icons.Trees className="w-4 h-4 text-teal-400 flex-shrink-0" />;
  }
  if (a.includes('bote') || a.includes('canoa') || a.includes('pesca') || a.includes('kayak') || a.includes('rio') || a.includes('agua') || a.includes('mar') || a.includes('natacion') || a.includes('termal')) {
    return <Icons.Waves className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
  }
  if (a.includes('camp') || a.includes('camping')) {
    return <Icons.Trees className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  }
  if (a.includes('artesan') || a.includes('compra') || a.includes('mercado') || a.includes('souvenir')) {
    return <Icons.Award className="w-4 h-4 text-amber-400 flex-shrink-0" />;
  }
  if (a.includes('estudio') || a.includes('investig') || a.includes('cientif') || a.includes('arqueol')) {
    return <Icons.Database className="w-4 h-4 text-indigo-400 flex-shrink-0" />;
  }
  if (a.includes('ritual') || a.includes('mistic') || a.includes('tradicion') || a.includes('folclor') || a.includes('danza') || a.includes('fiesta') || a.includes('cultura')) {
    return <Icons.Sparkles className="w-4 h-4 text-rose-400 flex-shrink-0" />;
  }
  return <Icons.Compass className="w-4 h-4 text-sky-400 flex-shrink-0" />;
};

function SmallActivityIcon({ url, name }: { url?: string; name: string }) {
  const [hasError, setHasError] = useState(!url);

  if (hasError || !url) {
    return (
      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center p-1 flex-shrink-0">
        {getActivityIcon(name)}
      </div>
    );
  }

  return (
    <div className="w-7 h-7 rounded-lg bg-white/95 border border-slate-600/60 p-0.5 flex items-center justify-center flex-shrink-0 shadow-sm">
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
    return <Icons.Footprints className="w-4 h-4 text-emerald-400" />;
  }
  if (t.includes('bus') || t.includes('combi') || t.includes('colectivo') || t.includes('minivan')) {
    return <Icons.Bus className="w-4 h-4 text-sky-400" />;
  }
  if (t.includes('bote') || t.includes('lancha') || t.includes('canoa') || t.includes('fluvial') || t.includes('maritimo')) {
    return <Icons.Waves className="w-4 h-4 text-cyan-400" />;
  }
  return <Icons.Car className="w-4 h-4 text-amber-400" />;
};

// Parser robusto de Rutas de Acceso (soporta array estructurado o texto concatenado de MINCETUR)
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

  // Buscar patrones numéricos tipo: "1 Huánuco/... - Huánuco/... Plaza de Jesús - Plaza de Cauri Terrestre Camioneta... 11.2 Km / 24 Min"
  const regex = /(?:(\d+)\s+)?([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s\/]+?\s*-\s*[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s\/]+?)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s\/]+?\s*-\s*[A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s\/]+?)\s+(Terrestre|Fluvial|A[ée]reo)?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s]+?)\s+(Asfaltado|Afirmado|Sendero|Trocha|Fluvial|A[ée]reo|Pavimentado)\s+([\d\.,]+\s*(?:Km|Mts|m|km|mts|Metros)\s*\/\s*[\d\s\w]+)/gi;

  const results: FichaRutaAcceso[] = [];
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    results.push({
      recorrido: m[1] || '1',
      tramo: m[2]?.trim(),
      detalle: m[3]?.trim(),
      tipo_acceso: m[4]?.trim() || 'Terrestre',
      medio_transporte: m[5]?.trim(),
      tipo_via: m[6]?.trim(),
      distancia_tiempo: m[7]?.trim(),
    });
  }

  // Si el regex no captura por variaciones, separar por tramos "1 ..."
  if (results.length === 0) {
    const segments = text.split(/(?=\b\d+\s+[A-ZÁÉÍÓÚ])/g);
    for (const seg of segments) {
      const clean = seg.trim();
      if (!clean) continue;
      results.push({
        tramo: clean,
        detalle: '',
        medio_transporte: clean.toLowerCase().includes('a pie') ? 'A pie' : 'Vehicular / Terrestre',
        tipo_via: clean.toLowerCase().includes('asfaltado') ? 'Asfaltado' : clean.toLowerCase().includes('afirmado') ? 'Afirmado' : 'Sendero / Vía oficial',
        distancia_tiempo: clean.match(/[\d\.,]+\s*(?:Km|Mts|km|mts)\s*\/\s*[\d\s\w]+/i)?.[0] || '',
      });
    }
  }

  return results;
}

// Parser robusto de Época Propicia (soporta array estructurado o texto concatenado de MINCETUR)
function parseEpocaList(ficha: FichaDetail | null): FichaEpocaPropicia[] {
  if (ficha?.epoca_propicia && ficha.epoca_propicia.length > 0) {
    return ficha.epoca_propicia;
  }

  const rawSection = ficha?.secciones?.find((s) => {
    const t = s.titulo.toLowerCase();
    return t.includes('epoca propicia') || t.includes('época propicia');
  });

  if (!rawSection || !rawSection.contenido_texto) return [];

  const text = rawSection.contenido_texto
    .replace(/^Época propicia de visita al recurso\s+Especificación\s+Hora de visita especificación\s+Observaciones\s*/i, '')
    .trim();

  // Detectar época, horario y observaciones
  const horarioMatch = text.match(/(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)\s*-\s*\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?))/i);
  const horario = horarioMatch ? horarioMatch[1] : '08:00 a.m. - 05:00 p.m.';

  let epoca = 'Todo el Año';
  if (text.toLowerCase().includes('mayo a octubre')) epoca = 'Mayo a Octubre';
  else if (text.toLowerCase().includes('abril a noviembre')) epoca = 'Abril a Noviembre';
  else if (text.toLowerCase().includes('todo el a')) epoca = 'Todo el Año';

  let observaciones = '';
  const obsIndex = text.toLowerCase().indexOf('se recomienda');
  if (obsIndex !== -1) {
    observaciones = text.substring(obsIndex).trim();
  } else {
    observaciones = text.replace(horario, '').replace(epoca, '').replace(/--/g, '').trim();
  }

  return [
    {
      epoca,
      especificacion: '--',
      horario,
      observaciones: observaciones || 'Consultar con guías oficiales y autoridades locales antes de la visita.',
    },
  ];
}

function cleanLabel(text: string | null | undefined): string {
  if (!text) return '';
  // Elimina prefijos como "1. ", "2. ", "j. ", "a. ", "a) ", "1) ", "I. ", etc.
  let cleaned = text
    .replace(/^[0-9a-zA-Z]{1,3}[\.\)\-]\s*/, '')
    .replace(/^[\.\-\/\s]+/, '')
    .trim();

  if (!cleaned) cleaned = text.trim();

  // Convertir a formato Capitalizado / Minúsculas limpio (Title Case)
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

function cleanAltitud(alt: string | null | undefined): string {
  if (!alt) return 'Consultar en sitio';
  const trimmed = alt.trim();
  if (/^\d+$/.test(trimmed)) {
    return `${Number(trimmed).toLocaleString()} m.s.n.m.`;
  }
  return trimmed;
}

export default function FichaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string) || '';
  const codFicha = extractCodeFromSlug(slug);

  const [ficha, setFicha] = useState<FichaDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    if (!codFicha) {
      setError('Código de recurso turístico no válido.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    apiService
      .getFichaDetail(codFicha)
      .then((data) => {
        setFicha(data);
        if (data?.galeria_fotos?.length) {
          setSelectedPhoto(data.galeria_fotos[0]);
        } else if (data?.foto_principal) {
          setSelectedPhoto(data.foto_principal);
        }
      })
      .catch((err) => {
        console.error('Error al cargar la ficha:', err);
        setError('Esta ficha no existe o ha sido dada de baja del inventario oficial.');
      })
      .finally(() => setLoading(false));
  }, [codFicha]);

  // Extraer YouTube Embed URL
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

  // Listas parseadas y estructuradas
  const rutasAcceso = useMemo(() => parseRutasList(ficha), [ficha]);
  const epocaPropicia = useMemo(() => parseEpocaList(ficha), [ficha]);

  // Otras Secciones que no sean Descripción, Rutas, Época, Actividades ni Responsable
  const otherSections = (ficha?.secciones || []).filter((sec) => {
    const t = sec.titulo.toLowerCase();
    return (
      !t.includes('descrip') &&
      !t.includes('ruta de acceso') &&
      !t.includes('acceso') &&
      !t.includes('epoca propicia') &&
      !t.includes('época propicia') &&
      !t.includes('actividad') &&
      !t.includes('responsable')
    );
  });

  // Dividir descripción en párrafos limpios, legibles y sin duplicados
  const descriptionParagraphs = useMemo(() => {
    if (!ficha?.descripcion) return [];
    let cleanDesc = ficha.descripcion.trim();
    // Eliminar posible duplicado idéntico si se concatenó dos veces
    const half = Math.floor(cleanDesc.length / 2);
    if (cleanDesc.length > 100 && cleanDesc.substring(0, half).trim() === cleanDesc.substring(half).trim()) {
      cleanDesc = cleanDesc.substring(0, half).trim();
    }
    const paragraphs = cleanDesc
      .split(/(?<=\.\s+)(?=[A-ZÁÉÍÓÚ])/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Filtrar párrafos duplicados
    const uniqueParagraphs: string[] = [];
    for (const p of paragraphs) {
      if (!uniqueParagraphs.some((existing) => existing === p || existing.includes(p) || p.includes(existing))) {
        uniqueParagraphs.push(p);
      }
    }
    return uniqueParagraphs.length > 0 ? uniqueParagraphs : paragraphs;
  }, [ficha?.descripcion]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pt-6 sm:pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <Link href="/" className="hover:text-amber-400 transition-colors flex items-center gap-1.5">
              <Icons.Compass className="w-4 h-4" />
              <span>Inicio</span>
            </Link>
            <span className="text-slate-600">/</span>
            <Link href="/turismo" className="hover:text-sky-400 transition-colors">
              Turismo
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-md">
              {ficha?.nombre || `Ficha #${codFicha}`}
            </span>
          </nav>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white transition-all shadow-md cursor-pointer"
          >
            <Icons.ChevronRight className="w-4 h-4 rotate-180" />
            <span>Volver al Catálogo</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-32 flex flex-col items-center justify-center gap-4 bg-slate-900/60 rounded-3xl border border-slate-800 backdrop-blur-md">
            <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-300">Cargando información oficial del recurso...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-24 text-center bg-slate-900/60 rounded-3xl border border-rose-500/30 p-8 backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Icons.Info className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              El recurso solicitado no se encuentra publicado o no está registrado en el inventario oficial.
            </p>
            <Link
              href="/turismo"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg hover:brightness-110 transition-all"
            >
              Explorar otros destinos oficiales
            </Link>
          </div>
        )}

        {/* Resource Main Content */}
        {!loading && ficha && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Card */}
            <div className="relative rounded-3xl overflow-hidden bg-slate-900/90 border border-slate-700/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Ficha Oficial N° {ficha.cod_ficha}
                    </span>
                    {ficha.categoria && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {cleanLabel(ficha.categoria)}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                    {ficha.nombre}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-2 mt-3">
                    <Icons.MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>
                      {ficha.departamento} &gt; {ficha.provincia} &gt; {ficha.distrito}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={ficha.url_ficha}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-200 transition-all flex items-center gap-2 shadow-lg"
                  >
                    <span>Ficha Fuente</span>
                    <Icons.ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Photo Showcase & Key Specs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Photo Showcase (Col 2) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                    <Icons.Camera className="w-4 h-4 text-sky-400" />
                    <span>Fotografía Oficial del Recurso</span>
                  </h3>

                  {/* Main Image Container */}
                  <div className="relative w-full h-80 sm:h-[440px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
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
                        <Icons.Camera className="w-12 h-12 text-slate-600 mb-2" />
                        <span className="text-xs font-medium text-slate-400">Sin fotografía digitalizada en ficha oficial</span>
                      </div>
                    )}
                  </div>

                  {/* Thumbnails Row */}
                  {ficha.galeria_fotos && ficha.galeria_fotos.length > 1 && (
                    <div className="mt-4">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Galería Oficial ({ficha.galeria_fotos.length} fotos)
                      </span>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {ficha.galeria_fotos.map((photo, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedPhoto(photo);
                              setImgError(false);
                            }}
                            className={`relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all cursor-pointer ${
                              selectedPhoto === photo
                                ? 'border-amber-400 ring-2 ring-amber-400/40 opacity-100 scale-105'
                                : 'border-slate-800 opacity-60 hover:opacity-100'
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
                  <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                      <h2 className="text-sm font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <Icons.Info className="w-4 h-4 text-amber-400" />
                        <span>Descripción Oficial del Atractivo</span>
                      </h2>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                        Inventario MINCETUR
                      </span>
                    </div>

                    <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {descriptionParagraphs.map((paragraph, pIdx) => (
                        <p key={pIdx} className="text-slate-300 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Specifications (Col 1) */}
              <div className="space-y-6">
                {/* Classification Box */}
                <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Icons.Layers className="w-4 h-4 text-sky-400" />
                    <span>Ficha Técnica Oficial</span>
                  </h3>

                  <div className="space-y-3 divide-y divide-slate-800/80 text-xs">
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-400">Categoría:</span>
                      <span className="font-bold text-white text-right">{cleanLabel(ficha.categoria) || 'No especificada'}</span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-400">Tipo:</span>
                      <span className="font-bold text-white text-right">{cleanLabel(ficha.tipo) || 'No especificado'}</span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-400">Subtipo:</span>
                      <span className="font-bold text-white text-right">{cleanLabel(ficha.subtipo) || 'No especificado'}</span>
                    </div>
                    <div className="pt-2 flex justify-between gap-2">
                      <span className="text-slate-400">Altitud:</span>
                      <span className="font-bold text-sky-300 text-right">{cleanAltitud(ficha.altitud)}</span>
                    </div>
                  </div>

                  {/* Enlace Oficial a Google Maps / Ubicación Georreferenciada */}
                  <div className="pt-2 border-t border-slate-800/80">
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
                      className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Icons.MapPin className="w-4 h-4 text-amber-300 flex-shrink-0" />
                      <span>Ver Ubicación en Mapa</span>
                      <Icons.ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                </div>

                {/* Época Propicia de Visita y Horarios (Ubicado directamente debajo de Ficha Técnica Oficial) */}
                {epocaPropicia.length > 0 && (
                  <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                        <Icons.Calendar className="w-4 h-4 text-amber-400" />
                        <span>Época Propicia y Horarios</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-950/40 text-amber-300 border border-amber-800/40">
                        Visita
                      </span>
                    </div>

                    <div className="space-y-3">
                      {epocaPropicia.map((ep, idx) => (
                        <div key={idx} className="space-y-3">
                          {/* Temporada */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                              <Icons.Sun className="w-3.5 h-3.5" />
                              Temporada Recomendada
                            </span>
                            <p className="text-sm font-black text-white">
                              {ep.epoca || 'Todo el Año'}
                            </p>
                            {ep.especificacion && ep.especificacion !== '--' && (
                              <p className="text-[11px] text-slate-400">{ep.especificacion}</p>
                            )}
                          </div>

                          {/* Horario */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block flex items-center gap-1.5">
                              <Icons.Clock className="w-3.5 h-3.5" />
                              Horario de Visita
                            </span>
                            <p className="text-sm font-black text-white">
                              {ep.horario || '08:00 a.m. - 05:00 p.m.'}
                            </p>
                          </div>

                          {/* Recomendaciones */}
                          {ep.observaciones && (
                            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block flex items-center gap-1.5">
                                <Icons.Shield className="w-3.5 h-3.5" />
                                Recomendaciones
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                {ep.observaciones}
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
                  <div className="bg-slate-900/90 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                        <Icons.Compass className="w-4 h-4 text-amber-400" />
                        <span>Actividades en el Recurso</span>
                      </h3>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                        {(ficha.actividades_detalle || ficha.actividades_permitidas).length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ficha.actividades_detalle && ficha.actividades_detalle.length > 0
                        ? ficha.actividades_detalle.map((act, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
                            >
                              <SmallActivityIcon url={act.icono_url} name={act.tipo || act.actividad} />
                              <span className="text-xs font-medium text-slate-200 leading-snug" title={act.tipo}>
                                {act.tipo}
                              </span>
                            </div>
                          ))
                        : ficha.actividades_permitidas.map((act, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 transition-all shadow-sm"
                            >
                              <SmallActivityIcon name={act} />
                              <span className="text-xs font-medium text-slate-200 leading-snug" title={act}>
                                {act}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Ruta de Acceso al Recurso (Paso a Paso Visual / Timeline Cards) */}
            {rutasAcceso.length > 0 && (
              <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Icons.Navigation className="w-5 h-5 text-sky-400" />
                      <span>Ruta de Acceso al Recurso (Cómo Llegar)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Itinerario oficial registrado tramo por tramo con medios de transporte, tipo de vía y tiempos estimados.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-sky-950/40 text-sky-300 border border-sky-800/40 self-start sm:self-auto">
                    {rutasAcceso.length} Tramos Registrados
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {rutasAcceso.map((ruta, idx) => (
                    <div
                      key={idx}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800/90 hover:border-sky-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Paso e Itinerario */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {ruta.detalle || ruta.tramo}
                          </h4>
                          {ruta.detalle && ruta.tramo && ruta.detalle !== ruta.tramo && (
                            <p className="text-[11px] text-slate-400">
                              {ruta.tramo}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Badges de Transporte, Vía y Distancia/Tiempo */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                        {/* Medio de transporte */}
                        {ruta.medio_transporte && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium">
                            {getTransportIcon(ruta.medio_transporte)}
                            <span>{ruta.medio_transporte}</span>
                          </div>
                        )}

                        {/* Tipo de Vía */}
                        {ruta.tipo_via && (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-slate-400 text-xs font-medium">
                            {ruta.tipo_via}
                          </div>
                        )}

                        {/* Distancia y Tiempo */}
                        {ruta.distancia_tiempo && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                            <Icons.Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>{ruta.distancia_tiempo}</span>
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
              <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-red-500/30 shadow-2xl space-y-4">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    <span>Material Audiovisual Oficial (Video en Vivo)</span>
                  </h2>
                </div>
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`Video oficial de ${ficha.nombre}`}
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
                <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Icons.Layers className="w-5 h-5 text-amber-400" />
                  <span>Información Adicional del Inventario Oficial</span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {otherSections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="bg-slate-900/80 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3"
                    >
                      <h3 className="text-xs font-bold uppercase tracking-widest text-sky-400 flex items-center gap-2">
                        <Icons.CheckCircle className="w-4 h-4 text-sky-400" />
                        <span>{sec.titulo}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                        {sec.contenido_texto}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
