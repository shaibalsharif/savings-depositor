CREATE TABLE "nominee_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"relation" varchar NOT NULL,
	"dob" date NOT NULL,
	"mobile" varchar NOT NULL,
	"nid" varchar NOT NULL,
	"address" text NOT NULL,
	"photo" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personal_info" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"name_bn" varchar NOT NULL,
	"guardian" varchar NOT NULL,
	"dob" date NOT NULL,
	"profession" varchar NOT NULL,
	"religion" varchar NOT NULL,
	"present_address" text NOT NULL,
	"permanent_address" text NOT NULL,
	"mobile" varchar NOT NULL,
	"photo" text NOT NULL,
	"position" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
