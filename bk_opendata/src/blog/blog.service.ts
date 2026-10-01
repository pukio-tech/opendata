import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * API pública del blog (sin autenticación).
 * Solo expone artículos publicados; la gestión se hace en /api/admin/posts.
 */

/** Campos para listados (sin el contenido completo). */
const LIST_SELECT = {
  id: true,
  title: true,
  slug: true,
  summary: true,
  coverImage: true,
  publishedAt: true,
  updatedAt: true,
  author: { select: { name: true } },
} satisfies Prisma.BlogPostSelect;

/** ~200 palabras por minuto de lectura. */
function readingTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  /** Publicados y con fecha de publicación ya cumplida (permite programar artículos). */
  private published(): Prisma.BlogPostWhereInput {
    return {
      isPublished: true,
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
    };
  }

  async findAll(page = 1, limit = 12) {
    const take = Math.min(50, Math.max(1, Number(limit) || 12));
    const current = Math.max(1, Number(page) || 1);
    const where = this.published();

    const [total, items] = await Promise.all([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        select: { ...LIST_SELECT, content: true },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (current - 1) * take,
        take,
      }),
    ]);

    return {
      success: true,
      data: items.map(({ content, ...post }) => ({ ...post, readingTime: readingTime(content) })),
      pagination: { total, page: current, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { ...this.published(), slug },
      select: {
        ...LIST_SELECT,
        content: true,
        metaTitle: true,
        metaDescription: true,
        keywords: true,
        canonicalUrl: true,
        ogImage: true,
        createdAt: true,
      },
    });

    if (!post) {
      throw new NotFoundException(`Artículo "${slug}" no encontrado`);
    }

    const related = await this.prisma.blogPost.findMany({
      where: { ...this.published(), NOT: { id: post.id } },
      select: LIST_SELECT,
      orderBy: { publishedAt: 'desc' },
      take: 3,
    });

    return {
      success: true,
      data: { ...post, readingTime: readingTime(post.content) },
      related,
    };
  }

  /** Slugs y fechas para el sitemap del frontend. */
  async sitemap() {
    return this.prisma.blogPost.findMany({
      where: this.published(),
      select: { slug: true, updatedAt: true },
      orderBy: { publishedAt: 'desc' },
    });
  }
}
