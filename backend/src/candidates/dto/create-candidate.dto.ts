import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  resumeUrl?: string;
}