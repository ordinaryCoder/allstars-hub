/**
 * Centralized Auth & User Provisioning Constants
 * Shared across server actions, validation logic, and admin UI components.
 */

/**
 * Utility helper to generate a secure random password
 */
export function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let pass = '';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}
