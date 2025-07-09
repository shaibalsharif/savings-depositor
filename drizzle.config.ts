import type { Config } from "drizzle-kit";

export default {
  schema: "./db/schema.ts", // or wherever your schema files are
  out: "./drizzle/migrations",

  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://neondb_owner:npg_69dqmWwkXYgc@ep-lingering-field-a8nzsa0i-pooler.eastus2.azure.neon.tech/neondb?sslmode=require",
  },
} satisfies Config;
