import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInterviewDto {
  @IsInt()
  @Min(1)
  candidateId!: number;

  @IsDateString()
  scheduledAt!: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'COMPLETED', 'CANCELLED'])
  status?: string;
}
