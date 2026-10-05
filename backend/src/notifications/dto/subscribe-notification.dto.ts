import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubscribeNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  token!: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  platform?: string;
}