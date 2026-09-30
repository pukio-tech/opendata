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
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { AdminCompaniesService } from './admin-companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { QueryCompanyDto } from './dto/query-company.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Valida que el id sea un entero positivo (bigint) y lo deja como string:
 * los ids manuales (>= 9000000000) superan el rango de int4.
 */
@Injectable()
class ParseBigIntIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!/^\d{1,18}$/.test(value ?? '')) {
      throw new BadRequestException('El id de la empresa no es válido');
    }
    return value;
  }
}

@Controller('api/admin/companies')
@UseGuards(JwtAuthGuard)
export class AdminCompaniesController {
  constructor(private readonly companiesService: AdminCompaniesService) {}

  @Get()
  async findAll(@Query() query: QueryCompanyDto) {
    return this.companiesService.findAll(query);
  }

  /** Tipos de contribuyente, condiciones de domicilio y departamentos para los formularios. */
  @Get('options')
  async getOptions() {
    return this.companiesService.getOptions();
  }

  /** ?search=… → actividades CIIU por código o descripción (máx. 20). */
  @Get('ciiu')
  async searchCiiu(@Query('search') search?: string) {
    return this.companiesService.searchCiiu(search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateCompanyDto) {
    return this.companiesService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Body() updateDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateDto);
  }

  @Patch(':id')
  async patch(
    @Param('id', ParseBigIntIdPipe) id: string,
    @Body() updateDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseBigIntIdPipe) id: string) {
    return this.companiesService.remove(id);
  }
}
