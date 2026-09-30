import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogPostDto } from './dto/create-post.dto';
import { UpdateBlogPostDto } from './dto/update-post.dto';
import { QueryBlogPostDto } from './dto/query-post.dto';

@Injectable()
export class AdminPostsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async findAll(query: QueryBlogPostDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { summary: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isPublished !== undefined) {
      where.isPublished = query.isPublished;
    }

    const [total, items] = await Promise.all([
      this.prisma.blogPost.count({ where }),
      this.prisma.blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      data: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Publicación con ID "${id}" no encontrada`);
    }

    return {
      success: true,
      data: post,
    };
  }

  async create(dto: CreateBlogPostDto, authorId?: string) {
    let slug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);

    const existing = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const post = await this.prisma.blogPost.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        summary: dto.summary || dto.content.slice(0, 200),
        coverImage: dto.coverImage,
        isPublished: dto.isPublished ?? false,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : (dto.isPublished ? new Date() : null),
        authorId: authorId || null,
        metaTitle: dto.metaTitle || dto.title,
        metaDescription: dto.metaDescription || dto.summary || dto.content.slice(0, 160),
        keywords: dto.keywords,
        canonicalUrl: dto.canonicalUrl,
        ogImage: dto.ogImage || dto.coverImage,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Publicación creada exitosamente',
      data: post,
    };
  }

  async update(id: string, dto: UpdateBlogPostDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.slug) {
      data.slug = this.slugify(dto.slug);
      const existing = await this.prisma.blogPost.findUnique({
        where: { slug: data.slug },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`El slug "${data.slug}" ya está en uso.`);
      }
    }

    if (dto.publishedAt) {
      data.publishedAt = new Date(dto.publishedAt);
    } else if (dto.isPublished === true) {
      const current = await this.prisma.blogPost.findUnique({ where: { id } });
      if (!current?.publishedAt) {
        data.publishedAt = new Date();
      }
    }

    const updated = await this.prisma.blogPost.update({
      where: { id },
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Publicación actualizada exitosamente',
      data: updated,
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.blogPost.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Publicación eliminada exitosamente',
    };
  }
}
