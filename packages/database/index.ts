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
  throw new Error("DATABASE_URL is missing. Next.js is not loading the monorepo root .env file.");
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