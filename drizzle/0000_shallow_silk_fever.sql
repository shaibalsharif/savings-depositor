CREATE TABLE "deposit_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deposit_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"monthly_amount" varchar(50) NOT NULL,
	"due_day" varchar(2) NOT NULL,
	"reminder_day" varchar(2) NOT NULL,
	"effective_month" varchar(7) NOT NULL,
	"terminated_at" varchar(7) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deposits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deposits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"month" varchar(32) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transaction_id" varchar(128) NOT NULL,
	"deposit_type" varchar(16) DEFAULT 'full' NOT NULL,
	"fund_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"updated_balance" numeric(10, 2) NOT NULL,
	"note" varchar(200) NOT NULL,
	"updated_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fund_transactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "fund_transactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"from_fund_id" integer NOT NULL,
	"to_fund_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"description" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "funds" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "funds_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(255) NOT NULL,
	"balance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'BDT' NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"action" varchar(255) NOT NULL,
	"details" varchar(2048) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nominee_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "nominee_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"relation" varchar(255) NOT NULL,
	"dob" date NOT NULL,
	"mobile" varchar(20) NOT NULL,
	"nid_number" varchar(17) NOT NULL,
	"address" text NOT NULL,
	"photo" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_user_id" text NOT NULL,
	"sender_user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"related_entity_id" text NOT NULL,
	"role_target" varchar(50) NOT NULL,
	"action_required" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "personal_info" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_info_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_bn" varchar(255) NOT NULL,
	"father" varchar(255) NOT NULL,
	"dob" date NOT NULL,
	"profession" varchar(255) NOT NULL,
	"religion" varchar(255) NOT NULL,
	"present_address" text NOT NULL,
	"permanent_address" text NOT NULL,
	"mobile" varchar(20) NOT NULL,
	"nid_number" varchar(17) NOT NULL,
	"nid_front" text NOT NULL,
	"nid_back" text NOT NULL,
	"signature" text NOT NULL,
	"position" varchar(50) DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "withdrawals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "withdrawals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"fund_id" integer NOT NULL,
	"purpose" varchar(128) NOT NULL,
	"details" text NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar(255) NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"attachment_url" text NOT NULL,
	"rejection_reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_from_fund_id_funds_id_fk" FOREIGN KEY ("from_fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_to_fund_id_funds_id_fk" FOREIGN KEY ("to_fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_fund_id_funds_id_fk" FOREIGN KEY ("fund_id") REFERENCES "public"."funds"("id") ON DELETE no action ON UPDATE no action;