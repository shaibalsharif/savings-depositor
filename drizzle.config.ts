import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema/logs.ts", // or wherever your schema files are
  out: "./drizzle/migrations",
  
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_wW1YurmnOZy7@ep-muddy-paper-a4dfcw25-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
  },
} satisfies Config;
