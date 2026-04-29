CREATE TABLE "deposit_allocations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deposit_allocations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"alloc_id" varchar(64) NOT NULL,
	"payment_id" varchar(64) NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"for_month" varchar(7) NOT NULL,
	"amount_allocated" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deposit_allocations_alloc_id_unique" UNIQUE("alloc_id")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "expenses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entry_id" varchar(64) NOT NULL,
	"expense_date" date NOT NULL,
	"category" varchar(32) NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"linked_investment_id" varchar(64),
	"recorded_by" varchar(255) NOT NULL,
	"voided" boolean DEFAULT false NOT NULL,
	"sheets_row_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "investments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entry_id" varchar(64) NOT NULL,
	"invest_date" date NOT NULL,
	"recipient" varchar(255) NOT NULL,
	"principal" numeric(12, 2) NOT NULL,
	"expected_return_date" date NOT NULL,
	"actual_return_date" date,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"note" varchar(255),
	"recorded_by" varchar(255) NOT NULL,
	"sheets_row_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "investments_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"payment_id" varchar(64) NOT NULL,
	"member_id" varchar(255) NOT NULL,
	"amount_received" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"note" varchar(200),
	"voided" boolean DEFAULT false NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"updated_by" varchar(255),
	"sheets_row_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "revenue_losses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "revenue_losses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"entry_id" varchar(64) NOT NULL,
	"event_date" date NOT NULL,
	"source_type" varchar(32) NOT NULL,
	"description" varchar(255) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"linked_investment_id" varchar(64),
	"recorded_by" varchar(255) NOT NULL,
	"voided" boolean DEFAULT false NOT NULL,
	"sheets_row_index" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revenue_losses_entry_id_unique" UNIQUE("entry_id")
);
--> statement-breakpoint
ALTER TABLE "deposit_settings" ALTER COLUMN "terminated_at" DROP NOT NULL;