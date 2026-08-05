/**
 * Safely parses the payload section of a JWT string.
 * Handles base64url encoding, padding, and malformed input gracefully without throwing errors.
 */
export function parseJwtPayload<T = Record<string, unknown>>(token?: string | null): T | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = Buffer.from(paddedBase64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload) as T;
  } catch {
    return null;
  }
}

/**
 * Standardized role & status based redirect route resolution.
 * Used across root page, login actions, and auth guards to eliminate routing drift.
 */
export function getRoleRedirectPath(
  rolesOrPermissions: string | string[] | null | undefined,
  status: string = 'ACTIVE',
  email: string = ''
): string {
  if (!status || status === 'PENDING') {
    return `/pending?email=${encodeURIComponent(email)}`;
  }

  if (status !== 'ACTIVE') {
    return `/unauthorized?email=${encodeURIComponent(email)}`;
  }

  const rawList = Array.isArray(rolesOrPermissions)
    ? rolesOrPermissions
    : rolesOrPermissions
    ? [rolesOrPermissions]
    : [];

  const rolesStr = rawList.join(',').toLowerCase();

  if (rolesStr.includes('admin')) {
    return '/admin';
  }
  if (rolesStr.includes('coach')) {
    return '/coach';
  }
  if (rolesStr.includes('player') || rolesStr.includes('parent')) {
    return '/player';
  }

  return `/unauthorized?email=${encodeURIComponent(email)}`;
}
