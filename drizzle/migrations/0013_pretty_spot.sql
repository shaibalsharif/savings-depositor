ALTER TABLE "deposits" ALTER COLUMN "transaction_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deposits" ALTER COLUMN "deposit_type" SET DEFAULT 'full';