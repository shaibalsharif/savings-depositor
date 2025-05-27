CREATE TABLE "deposit_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"monthly_amount" numeric(12, 2) NOT NULL,
	"due_day" integer NOT NULL,
	"reminder_day" integer NOT NULL,
	"effective_month" varchar(16) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
