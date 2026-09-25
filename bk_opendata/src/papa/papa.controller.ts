import { Controller, Get, Query, Header } from '@nestjs/common';
import { PapaService } from './papa.service';

@Controller('api')
export class PapaController {
  constructor(private readonly papaService: PapaService) {}

  @Get('papa-leon-xiv')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
  async getPapaCronograma(@Query('department') department?: string) {
    return this.papaService.getCronograma(department);
  }

  @Get('ruta-papa')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
  async getRutaPapa(@Query('department') department?: string) {
    return this.papaService.getCronograma(department);
  }
}
