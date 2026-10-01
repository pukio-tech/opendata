import type { Metadata } from 'next';
import Link from 'next/link';
import { blogApi } from '../../services/blogApi';
import { BlogCard } from '../../components/BlogCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';
const PAGE_SIZE = 12;

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Blog de Turismo y Datos Abiertos del Perú | OpenData',
  description:
    'Guías, rankings y análisis sobre turismo, museos y empresas del Perú elaborados con datos abiertos oficiales de MINCETUR, el Ministerio de Cultura y SUNAT.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog de Turismo y Datos Abiertos del Perú | OpenData',
    description:
      'Guías y análisis sobre turismo, museos y empresas del Perú con datos abiertos oficiales.',
    url: `${SITE_URL}/blog`,
    siteName: 'OpenData Perú',
    type: 'website',
  },
};

export default async function BlogPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const result = await blogApi.list(page, PAGE_SIZE);
  const posts = result?.data ?? [];
  const pagination = result?.pagination;

  const [featured, ...rest] = page === 1 ? posts : [undefined, ...posts];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Blog de OpenData Perú',
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.publishedAt,
      image: p.coverImage || undefined,
    })),
  };

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-12 pb-14 border-b border-slate-200 dark:border-slate-800 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,116,144,0.35),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto text-center">
          <span className="inline-flex items-center rounded-md border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-slate-300">
            Blog · Datos abiertos del Perú
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
            Historias contadas con datos
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Guías, rankings y análisis sobre turismo, museos y empresas del Perú, elaborados con la
            información oficial que publicamos en OpenData.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto relative z-10 text-center w-full pt-10">
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              {result ? 'Aún no hay artículos publicados' : 'No pudimos cargar los artículos'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {result ? 'Vuelve pronto: estamos preparando nuevas guías.' : 'Inténtalo de nuevo en unos minutos.'}
            </p>
          </div>
        ) : (
          <>
            {featured && (
              <div className="mb-8">
                <BlogCard post={featured} featured />
              </div>
            )}

            {rest.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => post && <BlogCard key={post.id} post={post} />)}
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-3 text-sm" aria-label="Paginación">
                {page > 1 && (
                  <Link
                    href={page === 2 ? '/blog' : `/blog?page=${page - 1}`}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 font-semibold hover:border-[#0B3B60]/40"
                  >
                    ← Anteriores
                  </Link>
                )}
                <span className="text-slate-500 dark:text-slate-400">
                  Página {page} de {pagination.totalPages}
                </span>
                {page < pagination.totalPages && (
                  <Link
                    href={`/blog?page=${page + 1}`}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 font-semibold hover:border-[#0B3B60]/40"
                  >
                    Siguientes →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  );
}
