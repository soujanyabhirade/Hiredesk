import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { USER_ROLES } from '../roles.js';
import type { UserRole } from '../roles.js';

export class ProvisionUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(USER_ROLES)
  role!: UserRole;
}