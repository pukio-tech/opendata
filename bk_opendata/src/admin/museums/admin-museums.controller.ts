import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminMuseumsService } from './admin-museums.service';
import { CreateMuseumDto } from './dto/create-museum.dto';
import { UpdateMuseumDto } from './dto/update-museum.dto';
import { QueryMuseumDto } from './dto/query-museum.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AppAccessGuard, RequireApp } from '../../auth/guards/app-access.guard';

@Controller('api/admin/museums')
@UseGuards(JwtAuthGuard, AppAccessGuard)
@RequireApp('opendata')
export class AdminMuseumsController {
  constructor(private readonly museumsService: AdminMuseumsService) {}

  @Get()
  async findAll(@Query() query: QueryMuseumDto) {
    return this.museumsService.findAll(query);
  }

  /** Categorías, tipos, administraciones, estados y departamentos para los formularios. */
  @Get('options')
  async getOptions() {
    return this.museumsService.getOptions();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.museumsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateMuseumDto) {
    return this.museumsService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMuseumDto,
  ) {
    return this.museumsService.update(id, updateDto);
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMuseumDto,
  ) {
    return this.museumsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.museumsService.remove(id);
  }
}
