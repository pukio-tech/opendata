import { Controller, Get, Param, Query, Res, ParseIntPipe, Header } from '@nestjs/common';
import { MinceturService } from './mincetur.service';
import { Response } from 'express';

@Controller('api')
export class MinceturController {
  constructor(private readonly minceturService: MinceturService) {}

  @Get('health')
  getHealth() {
    return this.minceturService.getHealth();
  }

  @Get('categories')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getCategories() {
    return this.minceturService.getCategoriesTree();
  }

  @Get('activities')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getActivities() {
    return this.minceturService.getActivitiesTree();
  }

  @Get('departments')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getDepartments() {
    return this.minceturService.getDepartments();
  }

  @Get('resources')
  async getResources(
    @Query('search') search?: string,
    @Query('codigo') codigo?: number,
    @Query('department') department?: string,
    @Query('activity') activity?: string,
    @Query('subactivity') subactivity?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
    @Query('subtype') subtype?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.minceturService.searchResources({
      search,
      codigo,
      department,
      activity,
      subactivity,
      category,
      type,
      subtype,
      page,
      limit,
    });
  }

  @Get('map/resources')
  async getMapResources(
    @Query('department') department?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
  ) {
    return this.minceturService.getMapResources({ department, category, search, limit });
  }

  @Get('map/geojson')
  async getMapGeoJson(
    @Query('department') department?: string,
    @Query('category') category?: string,
  ) {
    return this.minceturService.getMapGeoJson({ department, category });
  }

  @Get('resources/all')
  async getAllResources() {
    return this.minceturService.getAllResources();
  }

  @Get('departments/:iddpto/resources')
  async getResourcesByDepartment(@Param('iddpto') iddpto: string) {
    return this.minceturService.getResourcesByDepartment(iddpto);
  }

  @Get('featured')
  async getFeatured(
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.minceturService.getFeaturedResources({ limit, category });
  }

  @Get('resources/featured')
  async getResourcesFeatured(
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.minceturService.getFeaturedResources({ limit, category });
  }

  @Get('resources/:codFicha')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getResourceDetail(@Param('codFicha', ParseIntPipe) codFicha: number) {
    return this.minceturService.getFichaDetail(codFicha);
  }

  @Get('photos/:cod')
  getPhoto(@Param('cod') cod: string, @Res() res: Response) {
    const url = this.minceturService.getPhotoUrl(cod);
    res.redirect(301, url);
  }
}
