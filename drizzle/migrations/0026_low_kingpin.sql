ALTER TABLE "users" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "permissions" jsonb DEFAULT '[]';