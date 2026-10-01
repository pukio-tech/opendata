import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { blogApi, formatBlogDate } from '../../../services/blogApi';
import { Markdown } from '../../../components/Markdown';
import { BlogCard } from '../../../components/BlogCard';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://opendata.pukio.lat';

export const revalidate = 300;

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const result = await blogApi.detail(params.slug);
  if (!result) return { title: 'Artículo no encontrado | OpenData Perú' };

  const post = result.data;
  const title = post.metaTitle || `${post.title} | OpenData Perú`;
  const description = post.metaDescription || post.summary || undefined;
  const image = post.ogImage || post.coverImage || undefined;
  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    keywords: post.keywords || undefined,
    alternates: { canonical: post.canonicalUrl || `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url,
      siteName: 'OpenData Perú',
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const result = await blogApi.detail(params.slug);
  if (!result) notFound();

  const { data: post, related } = result;
  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.summary || undefined,
    image: post.ogImage || post.coverImage || undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author?.name || 'OpenData Perú' },
    publisher: { '@type': 'Organization', name: 'OpenData Perú', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: post.keywords || undefined,
  };

  return (
    <main className="flex-1 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 min-h-screen pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article>
        {/* Cabecera */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-10">
            <nav aria-label="Ruta de navegación" className="text-xs text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-[#0B3B60] dark:hover:text-white">Inicio</Link>
              <span className="mx-1.5">/</span>
              <Link href="/blog" className="hover:text-[#0B3B60] dark:hover:text-white">Blog</Link>
            </nav>

            <h1 className="mt-5 text-3xl sm:text-[2.6rem] font-bold tracking-tight leading-[1.15] text-slate-900 dark:text-white">
              {post.title}
            </h1>

            {post.summary && (
              <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{post.summary}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {post.author?.name || 'OpenData Perú'}
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt ?? undefined}>{formatBlogDate(post.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readingTime} min de lectura</span>
            </div>
          </div>
        </header>

        {/* Portada */}
        {post.coverImage && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 -mb-2 pt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full max-h-[460px] rounded-xl object-cover border border-slate-200 dark:border-slate-800"
            />
          </div>
        )}

        {/* Contenido */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
          <Markdown content={post.content} />

          {post.keywords && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 dark:border-slate-800 pt-6">
              {post.keywords
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
                .map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs text-slate-600 dark:text-slate-400"
                  >
                    #{k}
                  </span>
                ))}
            </div>
          )}

          <div className="mt-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#0B3B60] dark:text-sky-400 hover:underline"
            >
              ← Volver al blog
            </Link>
          </div>
        </div>
      </article>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <h2 className="mb-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sigue leyendo
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <BlogCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
