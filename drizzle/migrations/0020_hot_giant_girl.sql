ALTER TABLE "personal_info" ALTER COLUMN "name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "name_bn" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "father" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "dob" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "profession" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "religion" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "present_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "permanent_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "mobile" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "nid_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "nid_front" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "nid_back" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "signature" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "personal_info" ALTER COLUMN "position" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "personal_info" DROP COLUMN "photo";