ALTER TABLE "deposits" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deposits" ADD COLUMN "updated_by" varchar(255);