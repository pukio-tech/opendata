import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service';

@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.blogService.findAll(Number(page) || 1, Number(limit) || 12);
  }

  // Declarado antes de ':slug' para que no lo capture
  @Get('sitemap')
  async sitemap() {
    return this.blogService.sitemap();
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
