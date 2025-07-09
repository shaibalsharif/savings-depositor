ALTER TABLE "withdrawals" ALTER COLUMN "fund_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "action_required" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD COLUMN "requested_account" varchar(16);