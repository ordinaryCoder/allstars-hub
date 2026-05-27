import { redirect } from 'next/navigation';
import { prisma } from '../../../packages/database';

export async function requireRole(userId: string, requiredRole: string): Promise<void> {
  const userRoles = await prisma.userAcademyRole.findMany({
    where: { user_id: userId },
    select: { permissions: true }
  });

  if (!userRoles || userRoles.length === 0) {
    redirect('/login?error=no_role');
  }

  const roles = userRoles.flatMap((r) => r.permissions);

  if (!roles.includes(requiredRole)) {
    redirect('/login?error=unauthorized');
  }
}
