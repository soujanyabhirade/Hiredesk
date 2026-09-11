import { IsString, MinLength } from 'class-validator';

export class ActivateUserDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}