import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const getPrismaClient = () => {
  // Extract database file path from DATABASE_URL
  const dbFile = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.replace("file:", "") 
    : "./dev.db";
  
  // In Prisma 7, pass the url config directly to the adapter constructor
  const adapter = new PrismaBetterSqlite3({ url: dbFile });
  
  return new PrismaClient({ adapter });
};

export const db = globalForPrisma.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
