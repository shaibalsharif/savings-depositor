CREATE TABLE "deposits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"month" varchar(32) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_id" varchar(128) NOT NULL,
	"deposit_type" varchar(16) NOT NULL,
	"image_url" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "users" CASCADE;