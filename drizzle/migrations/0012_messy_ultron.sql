CREATE TABLE "terms" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nominee_info" RENAME COLUMN "nid" TO "nid_number";--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "monthly_amount" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "due_day" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "reminder_day" SET DATA TYPE varchar(2);--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "effective_month" SET DATA TYPE varchar(7);--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "nominee_info" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "nominee_info" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "nominee_info" ALTER COLUMN "relation" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "nominee_info" ALTER COLUMN "mobile" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "name" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "name_bn" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "profession" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "religion" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "mobile" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "position" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "deposit_settings" ADD COLUMN "terminated_at" varchar(7) DEFAULT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ADD COLUMN "father" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ADD COLUMN "nid_number" varchar(17) NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ADD COLUMN "nid_front" text NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ADD COLUMN "nid_back" text NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ADD COLUMN "signature" text NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" DROP COLUMN "guardian";