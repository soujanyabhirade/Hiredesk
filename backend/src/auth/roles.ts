export const USER_ROLES = [
  'ADMIN',
  'RECRUITER',
  'INTERVIEWER',
  'MENTOR',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = [
  'PENDING',
  'ACTIVE',
  'DISABLED',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];