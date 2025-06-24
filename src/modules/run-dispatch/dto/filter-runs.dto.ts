import { IsDateString, IsOptional } from 'class-validator';

export class FilterRunsDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
