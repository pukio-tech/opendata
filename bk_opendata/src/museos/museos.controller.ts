import { Controller, Get, Param, Query, Header } from '@nestjs/common';
import { MuseosService } from './museos.service';

@Controller('api/museos')
export class MuseosController {
  constructor(private readonly museosService: MuseosService) {}

  @Get('health')
  getHealth() {
    return { status: 'OK', service: 'Museos del Perú API' };
  }

  @Get('departments')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getDepartments() {
    return this.museosService.getDepartments();
  }

  @Get('categories')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getCategories() {
    return this.museosService.getCategories();
  }

  @Get('services')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getServices() {
    return this.museosService.getServices();
  }

  @Get('stats')
  @Header('Cache-Control', 'public, max-age=1800, s-maxage=3600')
  async getStats() {
    return this.museosService.getStats();
  }

  @Get('sitemap')
  @Header('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  async getSitemap() {
    return this.museosService.getSitemap();
  }

  @Get('featured')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400')
  async getFeatured(@Query('limit') limit?: number) {
    return this.museosService.getFeatured(limit ? Number(limit) : 6);
  }

  @Get('map/geojson')
  async getGeoJson(
    @Query('department') department?: string,
    @Query('category') category?: string,
  ) {
    return this.museosService.getGeoJson({ department, category });
  }

  @Get()
  async getMuseos(
    @Query('search') search?: string,
    @Query('department') department?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('hasVirtualTour') hasVirtualTour?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.museosService.searchMuseos({
      search,
      department,
      category,
      status,
      hasVirtualTour: hasVirtualTour === 'true' || hasVirtualTour === '1',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getDetail(@Param('slug') slug: string) {
    return this.museosService.getDetail(slug);
  }
}
