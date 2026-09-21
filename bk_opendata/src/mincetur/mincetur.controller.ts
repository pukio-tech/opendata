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

  @Get('resources/:codFicha')
  @Header('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400')
  async getResourceDetail(@Param('codFicha', ParseIntPipe) codFicha: number) {
    return this.minceturService.getFichaDetail(codFicha);
  }

  @Get('photos/:cod')
  async getPhoto(@Param('cod') cod: string, @Res() res: Response) {
    const { stream, contentType } = await this.minceturService.getPhotoStream(cod);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=2592000'); // 7 días cache browser, 30 días CDN
    stream.pipe(res);
  }
}
