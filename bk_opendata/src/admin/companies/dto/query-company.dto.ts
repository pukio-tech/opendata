import { IsOptional, IsString, IsNumber, IsBoolean, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryBoolean } from '../../shared/location.helper';

export class QueryCompanyDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  taxpayerType?: string;

  @IsOptional()
  @IsString()
  domicileCondition?: string;

  @IsOptional()
  @IsIn(['importado', 'manual'])
  source?: 'importado' | 'manual';

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
