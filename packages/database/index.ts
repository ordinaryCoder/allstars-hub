import { PrismaClient } from './generated/prisma';
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from 'pg';
import { env } from "prisma/config";
import * as dotenv from "dotenv";
import * as path from "path";

// Explicitly load the .env file from the monorepo root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
// Fallback to local .env if it exists in the database package
dotenv.config();

const databaseUrl = env("DATABASE_URL");

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Next.js is not loading the root .env file.");
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// RLS Utility: Pass raw JWT access_token to scope Prisma queries to tenant context
export const getTenantDb = (jwt?: string) => {
  if (!jwt) return prisma;

  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return prisma;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decodedJwt = Buffer.from(paddedBase64, 'base64').toString('utf-8');

    return prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            const [, result] = await prisma.$transaction([
              prisma.$executeRaw`SELECT set_config('request.jwt.claims', ${decodedJwt}::text, TRUE)`,
              query(args),
            ]);
            return result;
          },
        },
      },
    });
  } catch {
    return prisma;
  }
};