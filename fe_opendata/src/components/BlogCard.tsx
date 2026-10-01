import Link from 'next/link';
import type { BlogPostSummary } from '../types/blog';
import { formatBlogDate } from '../services/blogApi';

/** Tarjeta de artículo. `featured` la muestra en horizontal y más grande. */
export function BlogCard({ post, featured = false }: { post: BlogPostSummary; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#0B3B60]/40 dark:hover:border-slate-700 transition-all duration-200 shadow-xs ${
        featured ? 'flex-col md:flex-row' : 'flex-col h-full'
      }`}
    >
      <div
        className={`relative overflow-hidden bg-gradient-to-br from-[#0B3B60] to-slate-900 ${
          featured ? 'h-56 md:h-auto md:w-1/2 md:min-h-[320px]' : 'h-48'
        }`}
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            loading={featured ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-5xl font-black tracking-tight select-none">
            OpenData
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />
      </div>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8 justify-center' : 'p-5'}`}>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#0B3B60] dark:text-sky-400">
          {featured && <span className="rounded bg-sky-100 dark:bg-sky-500/15 px-1.5 py-0.5">Destacado</span>}
          <time dateTime={post.publishedAt ?? undefined}>{formatBlogDate(post.publishedAt)}</time>
          {post.readingTime ? <span className="text-slate-400 dark:text-slate-500">· {post.readingTime} min de lectura</span> : null}
        </div>
        <h2
          className={`mt-2 font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-[#0B3B60] dark:group-hover:text-sky-300 transition-colors ${
            featured ? 'text-2xl sm:text-3xl leading-tight' : 'text-lg leading-snug'
          }`}
        >
          {post.title}
        </h2>
        {post.summary && (
          <p
            className={`mt-3 text-slate-600 dark:text-slate-400 leading-relaxed ${
              featured ? 'text-base line-clamp-4' : 'text-sm line-clamp-3'
            }`}
          >
            {post.summary}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0B3B60] dark:text-sky-400">
          Leer artículo
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
        </span>
      </div>
    </Link>
  );
}
