// Role-based page access utility

export type UserRole = 'USER' | 'STAFF' | 'ADMIN' | 'SUPER_ADMIN';

export const CANACCESS: Record<string, UserRole[]> = {
  '/user': ['USER'],
  '/services': ['USER'],
  '/facilities': ['USER'],
  '/admin': ['ADMIN'],
  '/super-admin': ['SUPER_ADMIN'],
  '/user-landing': [], // Public
  '/': [], // Public (login/signup)
};

export function canAccessPage(path: string, role?: UserRole): boolean {
  const allowedRoles = CANACCESS[path];
  if (!allowedRoles) return false;
  if (allowedRoles.length === 0) return true; // Public page
  return role ? allowedRoles.includes(role) : false;
}
