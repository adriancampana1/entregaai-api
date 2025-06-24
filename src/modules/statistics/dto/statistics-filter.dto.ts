import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';

export enum PeriodType {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export class StatisticsFilterDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  driverId?: number;

  @IsOptional()
  @IsEnum(PeriodType)
  period?: PeriodType;
}
