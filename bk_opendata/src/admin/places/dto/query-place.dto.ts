import { IsOptional, IsString, IsNumber, IsBoolean, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryBoolean } from '../../shared/location.helper';

export class QueryTouristPlaceDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsIn(['mincetur', 'manual'])
  source?: 'mincetur' | 'manual';

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;
}
