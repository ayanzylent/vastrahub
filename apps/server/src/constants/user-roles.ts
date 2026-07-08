export const UserRole = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/** Role hierarchy — higher index = more privileges */
export const ROLE_HIERARCHY: UserRoleType[] = [
  UserRole.CUSTOMER,
  UserRole.ADMIN,
  UserRole.SUPERADMIN,
];

export function hasMinimumRole(userRole: UserRoleType, requiredRole: UserRoleType): boolean {
  return ROLE_HIERARCHY.indexOf(userRole) >= ROLE_HIERARCHY.indexOf(requiredRole);
}
