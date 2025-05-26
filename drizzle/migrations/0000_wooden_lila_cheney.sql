CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100),
	"email" varchar(100),
	"phone" varchar(20),
	"password_hash" varchar(255),
	"role" varchar(20),
	"archived" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
