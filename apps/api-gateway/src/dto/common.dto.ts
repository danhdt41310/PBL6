import { Type } from "class-transformer";
import { IsInt, Min, IsOptional, IsString, IsEnum } from "class-validator";

export class PaginationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number;
}

export class UserSearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  text?: string; // Search in email and name

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string; // active or blocked

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  birthday?: string; // Format: YYYY-MM-DD
}