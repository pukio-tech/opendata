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
import { AdminPlacesService } from './admin-places.service';
import { CreateTouristPlaceDto } from './dto/create-place.dto';
import { UpdateTouristPlaceDto } from './dto/update-place.dto';
import { QueryTouristPlaceDto } from './dto/query-place.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('api/admin/places')
@UseGuards(JwtAuthGuard)
export class AdminPlacesController {
  constructor(private readonly placesService: AdminPlacesService) {}

  @Get()
  async findAll(@Query() query: QueryTouristPlaceDto) {
    return this.placesService.findAll(query);
  }

  /** Categorías y departamentos para los formularios. */
  @Get('options')
  async getOptions() {
    return this.placesService.getOptions();
  }

  /** ?parent=XX → provincias · ?parent=XXXX → distritos */
  @Get('ubigeo')
  async getUbigeo(@Query('parent') parent: string) {
    return this.placesService.getUbigeoChildren(parent ?? '');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateTouristPlaceDto) {
    return this.placesService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTouristPlaceDto,
  ) {
    return this.placesService.update(id, updateDto);
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTouristPlaceDto,
  ) {
    return this.placesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.placesService.remove(id);
  }
}
