import { IsIn, IsOptional } from 'class-validator';
import { USER_ROLES, USER_STATUSES } from '../roles.js';
import type { UserRole, UserStatus } from '../roles.js';

export class UpdateUserDto {
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: UserStatus;
}