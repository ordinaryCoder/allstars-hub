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

/** An individual player record from the players table. */
export interface PlayerRecord {
  id: string; // players.id (UUID)
  first_name: string;
  last_name: string;
  dob?: Date | string | null;
  is_active: boolean;
  location?: { id: string; name: string } | null;
  /** The user account directly linked (self-login player) */
  linked_user?: { id: string; first_name: string; last_name: string; email?: string | null } | null;
  /** Parent accounts linked via parent_player */
  parent_accounts?: Array<{ id: string; first_name: string; last_name: string; email?: string | null }>;
}

/** Minimal shape required by confirmation modals — satisfied by both User and PlayerRecord */
export interface NamedEntity {
  first_name?: string | null;
  last_name?: string | null;
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
