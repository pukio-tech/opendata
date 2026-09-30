import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { QueryBoolean } from '../../shared/location.helper';

export class QueryBlogPostDto {
  @IsOptional()
  @IsString()
  search?: string;

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
