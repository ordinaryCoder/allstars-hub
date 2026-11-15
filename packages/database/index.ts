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
  max: 5, // Cap connection pool size to 5 per serverless instance
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Global Prisma Client instance configured with pg adapter.
 * The application operates as a single-academy platform.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });
globalForPrisma.prisma = prisma;
