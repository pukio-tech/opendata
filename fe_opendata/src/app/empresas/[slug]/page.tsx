'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Link, useTransitionRouter } from 'next-view-transitions';
import { useParams } from 'next/navigation';
import { empresasService } from '../../../services/empresasApi';
import { EmpresaItem, EmpresaListItem } from '../../../types/empresa';
import { EmpresaCard } from '../../../components/EmpresaCard';
import { Icons } from '../../../components/Icons';
import { AdsterraNativeBanner } from '../../../components/AdsterraNativeBanner';
import { ResponsiveLeaderboard } from '../../../components/AdsterraDisplayBanner';
import { OfficialBadge } from '../../../components/OfficialBadge';
import { TrustVerificationBadge } from '../../../components/TrustVerificationBadge';

interface FichaEmpresaPageProps {
  params?: { slug?: string };
}

function FichaEmpresaContent({ params }: FichaEmpresaPageProps) {
  const routeParams = useParams();
  const router = useTransitionRouter();
  const rawSlug = params?.slug || routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug || '';

  const [empresa, setEmpresa] = useState<EmpresaItem | null>(null);
  const [relatedEmpresas, setRelatedEmpresas] = useState<EmpresaListItem[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);
    setRelatedEmpresas([]);

    const isNumericRuc = /^\d{11}$/.test(slug);
    const fetcher = isNumericRuc
      ? empresasService.getByRuc(slug)
      : empresasService.getBySlug(slug);

    fetcher
      .then((data) => {
        setEmpresa(data);
        document.title = `${data.razon_social} (RUC ${data.numero_documento}) • Ficha SUNAT | OpenData`;

        // Cargar empresas relacionadas (por actividad económica o departamento)
        setLoadingRelated(true);
        (async () => {
          try {
            let results: EmpresaListItem[] = [];

            // 1. Intentar por código CIIU (misma actividad económica)
            if (data.codigo_ciiu) {
              const resCiiu = await empresasService.search({
                ciiu: data.codigo_ciiu,
                limit: 8,
              });
              results = (resCiiu?.data || []).filter(
                (item) => item.ruc !== data.numero_documento
              );
            }

            // 2. Si no alcanzamos 4, completar con el mismo departamento
            if (results.length < 4 && data.departamento) {
              const resDept = await empresasService.search({
                departamento: data.departamento,
                limit: 8,
              });
              const deptFiltered = (resDept?.data || []).filter(
                (item) =>
                  item.ruc !== data.numero_documento &&
                  !results.some((r) => r.ruc === item.ruc)
              );
              results = [...results, ...deptFiltered];
            }

            setRelatedEmpresas(results.slice(0, 4));
          } catch (e) {
            console.error('Error al cargar empresas relacionadas:', e);
            setRelatedEmpresas([]);
          } finally {
            setLoadingRelated(false);
          }
        })();
      })
      .catch((err) => {
        console.error('Error al cargar la empresa:', err);
        setError('Esta empresa no existe o no se encuentra registrada en el inventario actual.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopySummary = () => {
    if (!empresa) return;
    const text = `🏢 ${empresa.razon_social}\n📄 RUC: ${empresa.numero_documento}\n📍 Ubicación: ${[empresa.distrito, empresa.provincia, empresa.departamento].filter(Boolean).join(', ')}\n📋 Estado: ${empresa.estado_contribuyente} - ${empresa.condicion_domicilio}\n💼 Actividad: [${empresa.codigo_ciiu || '-'}] ${empresa.actividad_economica || '-'}\n🏠 Dirección: ${empresa.direccion || '-'}`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const googleMapsUrl = empresa?.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${empresa.direccion}, ${empresa.distrito || ''}, ${empresa.provincia || ''}, ${empresa.departamento || ''}, Peru`,
      )}`
    : null;

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* ========================================================================= */}
        {/* 1. NAVEGACIÓN Y ACCIONES SUPERIORES */}
        {/* ========================================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors flex items-center gap-1.5 font-medium">
              <Icons.Compass className="w-4 h-4 text-[#0B3B60] dark:text-slate-400" />
              <span>Inicio</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <Link href="/empresas" className="hover:text-[#0B3B60] dark:hover:text-white transition-colors font-medium">
              Empresas
            </Link>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-900 dark:text-white font-semibold truncate max-w-[200px] sm:max-w-md">
              {empresa?.razon_social || `RUC #${slug}`}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              {copiedLink ? (
                <>
                  <Icons.Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Enlace copiado</span>
                </>
              ) : (
                <>
                  <Icons.Share className="w-3.5 h-3.5 text-slate-400" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              {copiedSummary ? (
                <>
                  <Icons.Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">¡Ficha Copiada!</span>
                </>
              ) : (
                <>
                  <Icons.Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Ficha</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shadow-xs"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Volver</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-36 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Cargando información oficial del contribuyente...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 shadow-xs">
            <Icons.Building className="w-12 h-12 text-[#D91023] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Empresa no encontrada</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">{error}</p>
            <Link
              href="/empresas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
              <span>Volver al directorio</span>
            </Link>
          </div>
        )}

        {/* Content */}
        {!loading && empresa && (
          <div className="space-y-8">
            {/* Banner Publicitario Superior */}
            <ResponsiveLeaderboard className="my-2" />

            {/* HERO DE FICHA DE EMPRESA */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 shadow-xs relative">
              <div className="relative z-10 space-y-4">
                {/* Badges y RUC */}
                <div className="flex flex-wrap items-center gap-2">
                  <OfficialBadge variant="code">
                    RUC {empresa.numero_documento}
                  </OfficialBadge>

                  <OfficialBadge
                    variant={
                      empresa.estado_contribuyente === 'ACTIVO' ? 'activo' : 'nohabido'
                    }
                  >
                    ● {empresa.estado_contribuyente}
                  </OfficialBadge>

                  <OfficialBadge
                    variant={
                      empresa.condicion_domicilio === 'HABIDO' ? 'habido' : 'pendiente'
                    }
                  >
                    DOMICILIO {empresa.condicion_domicilio}
                  </OfficialBadge>

                  {empresa.departamento && (
                    <OfficialBadge variant="code">
                      {empresa.departamento}
                    </OfficialBadge>
                  )}

                  <TrustVerificationBadge source="SUNAT" date="25/09/2026" />
                </div>

                {/* Título Principal: Razón Social */}
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {empresa.razon_social}
                </h1>

                {/* Nombre Comercial si existe */}
                {empresa.nombre_comercial && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Nombre Comercial:{' '}
                    <strong className="text-slate-900 dark:text-slate-200 font-semibold">
                      {empresa.nombre_comercial}
                    </strong>
                  </p>
                )}

                {/* Tipo Societario */}
                {empresa.tipo_contribuyente && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
                    <Icons.Building className="w-3.5 h-3.5 text-[#0B3B60] dark:text-slate-400" />
                    <span>{empresa.tipo_contribuyente}</span>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN EN DOS COLUMNAS DE DETALLES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna 1: Información Tributaria SUNAT */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Icons.ShieldCheck className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Datos Tributarios Oficiales
                  </h2>
                </div>

                <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-3">
                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Número de RUC:</dt>
                    <dd className="font-mono font-bold text-slate-900 dark:text-white">{empresa.numero_documento}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Tipo de Contribuyente:</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white text-right max-w-[65%]">
                      {empresa.tipo_contribuyente || 'No especificado'}
                    </dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Estado del Contribuyente:</dt>
                    <dd className="font-bold text-emerald-700 dark:text-emerald-400">{empresa.estado_contribuyente}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Condición de Domicilio:</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{empresa.condicion_domicilio}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Fecha de Inscripción:</dt>
                    <dd className="font-mono text-slate-800 dark:text-slate-200">{empresa.fecha_inscripcion || '-'}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Inicio de Actividades:</dt>
                    <dd className="font-mono font-bold text-slate-900 dark:text-white">
                      {empresa.fecha_inicio_actividades || '-'}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Columna 2: Domicilio Fiscal y Ubicación */}
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Icons.MapPin className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Domicilio Fiscal y Ubicación
                  </h2>
                </div>

                <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-3">
                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Departamento:</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{empresa.departamento || '-'}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Provincia:</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{empresa.provincia || '-'}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Distrito:</dt>
                    <dd className="font-semibold text-slate-800 dark:text-slate-200">{empresa.distrito || '-'}</dd>
                  </div>

                  <div className="flex justify-between pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium">Código Ubigeo:</dt>
                    <dd className="font-mono text-slate-800 dark:text-slate-200">{empresa.codigo_ubigeo || '-'}</dd>
                  </div>

                  <div className="pt-2">
                    <dt className="text-slate-500 dark:text-slate-400 font-medium mb-1">Dirección declarada:</dt>
                    <dd className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white leading-relaxed border border-slate-200 dark:border-slate-800">
                      {empresa.direccion || 'Sin dirección registrada'}
                    </dd>
                  </div>

                  {googleMapsUrl && (
                    <div className="pt-2">
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0B3B60] dark:text-sky-400 hover:underline"
                      >
                        <Icons.MapPin className="w-3.5 h-3.5" />
                        <span>Ver ubicación aproximada en Google Maps</span>
                        <Icons.ArrowRight className="w-3 h-3 -rotate-45" />
                      </a>
                    </div>
                  )}
                </dl>
              </section>

              {/* Fila Completa: Actividad Económica CIIU */}
              <section className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Icons.Briefcase className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Actividad Económica Principal (CIIU)
                  </h2>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <OfficialBadge variant="code" className="shrink-0">
                    CIIU {empresa.codigo_ciiu || 'N/A'}
                  </OfficialBadge>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {empresa.actividad_economica || 'Actividad económica no registrada'}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Clasificación Internacional Industrial Uniforme (CIIU Revisión 4) declarada por el contribuyente ante la Superintendencia Nacional de Aduanas y de Administración Tributaria (SUNAT).
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Botones de acción institucional */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <a
                href="https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0B3B60] hover:bg-[#082C48] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <span>Validar en Consulta RUC SUNAT Oficial</span>
                <Icons.ArrowRight className="w-3.5 h-3.5 -rotate-45" />
              </a>

              <Link
                href="/empresas"
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#0B3B60] dark:hover:text-white transition-colors"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
                <span>Explorar más empresas en el catálogo</span>
              </Link>
            </div>

            {/* EMPRESAS RELACIONADAS (GRID DE 4 PARA MAYOR INTERACCIÓN) */}
            {(loadingRelated || relatedEmpresas.length > 0) && (
              <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Icons.Building className="w-5 h-5 text-[#0B3B60] dark:text-slate-400" />
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        Empresas Relacionadas
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Otras empresas activas en {empresa.departamento ? `${empresa.departamento}` : 'el Perú'} o con actividad económica similar.
                    </p>
                  </div>

                  {empresa.departamento && (
                    <Link
                      href={`/empresas?departamento=${encodeURIComponent(empresa.departamento)}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B3B60] dark:text-sky-400 hover:underline transition-colors"
                    >
                      <span>Ver más en {empresa.departamento}</span>
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
                    {relatedEmpresas.map((rel) => (
                      <EmpresaCard key={rel.ruc} empresa={rel} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Anuncio Nativo Adsterra al pie */}
            <AdsterraNativeBanner className="mt-8" />
          </div>
        )}
      </div>
    </main>
  );
}

export default function FichaEmpresaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-24">
          <div className="w-10 h-10 border-2 border-[#0B3B60] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <FichaEmpresaContent />
    </Suspense>
  );
}
