export interface UserLocationInfo {
  locationId: string;
  locationName: string;
}

export interface UserRole {
  permissions?: unknown;
}

export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  mobile_number?: string | null;
  status?: string | null;
  created_at?: Date | string | null;
  academy_roles?: UserRole[];
  locationInfos?: UserLocationInfo[];
}

export type ViewMode = 'players' | 'coaches' | 'pending' | 'inactive';

export const getPermissionsStr = (user: User): string => {
  const perms = user.academy_roles?.[0]?.permissions;
  if (!perms) return '';
  return Array.isArray(perms) ? perms.join(', ').toLowerCase() : String(perms).toLowerCase();
};

export const getPrimaryRole = (user: User): string => {
  const permStr = getPermissionsStr(user);
  if (permStr.includes('admin')) return 'Admin';
  if (permStr.includes('coach')) return 'Coach';
  if (permStr.includes('player')) return 'Player';
  if (permStr.includes('parent')) return 'Parent';
  return 'User';
};
