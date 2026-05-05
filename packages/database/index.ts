import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// RLS Utility: Call this inside Next.js API routes
export const getTenantDb = (jwt: string) => {
  // Decode JWT payload to pass to Postgres
  const payload = jwt.split('.')[1];
  const decodedJwt = Buffer.from(payload, 'base64').toString('utf-8');

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Wrap every query in a transaction that sets the JWT claim first
          const [, result] = await prisma.$transaction([
            prisma.$executeRaw`SELECT set_config('request.jwt.claims', ${decodedJwt}::text, TRUE)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
};