import {
  Controller,
  Get,
  Param,
  Query,
  Header,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasQueryParams } from './interfaces/empresa.interface';

@Controller('api/empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  /**
   * Listado paginado y búsqueda avanzada de empresas
   * GET /api/empresas?search=inversiones&departamento=LIMA&page=1&limit=20
   */
  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  async getEmpresas(
    @Query('search') search?: string,
    @Query('ruc') ruc?: string,
    @Query('departamento') departamento?: string,
    @Query('provincia') provincia?: string,
    @Query('distrito') distrito?: string,
    @Query('estado') estado?: string,
    @Query('condicion') condicion?: string,
    @Query('ciiu') ciiu?: string,
    @Query('tipo') tipo?: string,
    @Query('sortBy') sortBy?: 'recent' | 'name' | 'ruc',
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const params: EmpresasQueryParams = {
      search,
      ruc,
      departamento,
      provincia,
      distrito,
      estado,
      condicion,
      ciiu,
      tipo,
      sortBy,
      sortOrder,
      page,
      limit,
    };
    return this.empresasService.searchEmpresas(params);
  }

  /**
   * Resumen estadístico y KPIs para gráficos y tarjetas
   * GET /api/empresas/stats
   */
  @Get('stats')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  async getStats() {
    return this.empresasService.getStats();
  }

  /**
   * Sugerencias de autocompletado en tiempo real para barra de búsqueda
   * GET /api/empresas/suggest?q=banco&limit=8
   */
  @Get('suggest')
  @Header('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200')
  async getSuggestions(
    @Query('q') q: string,
    @Query('limit') limit?: number,
  ) {
    return this.empresasService.getSuggestions(q, limit ? Number(limit) : 8);
  }

  /**
   * Catálogos para filtros de departamentos, tipos y actividades
   * GET /api/empresas/catalogs
   */
  @Get('catalogs')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getCatalogs() {
    return this.empresasService.getCatalogs();
  }

  /**
   * Consulta directa por RUC (11 dígitos)
   * GET /api/empresas/ruc/:ruc
   */
  @Get('ruc/:ruc')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  async getByRuc(@Param('ruc') ruc: string) {
    return this.empresasService.getEmpresaByRuc(ruc);
  }

  /**
   * Consulta por slug amigable para SEO
   * GET /api/empresas/slug/:slug
   */
  @Get('slug/:slug')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  async getBySlug(@Param('slug') slug: string) {
    return this.empresasService.getEmpresaBySlug(slug);
  }

  /**
   * Endpoint optimizado para sitemap de Next.js
   * GET /api/empresas/sitemap
   */
  @Get('sitemap')
  @Header('Cache-Control', 'public, max-age=86400, s-maxage=86400')
  async getSitemap(@Query('limit') limit?: number) {
    return this.empresasService.getSitemapSlugs(limit ? Number(limit) : undefined);
  }

  /**
   * Consulta polimórfica (detecta si es RUC de 11 dígitos o slug)
   * GET /api/empresas/:idOrSlug
   */
  @Get(':idOrSlug')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  async getByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    const clean = idOrSlug.trim();
    if (/^\d{11}$/.test(clean)) {
      return this.empresasService.getEmpresaByRuc(clean);
    }
    return this.empresasService.getEmpresaBySlug(clean);
  }
}
