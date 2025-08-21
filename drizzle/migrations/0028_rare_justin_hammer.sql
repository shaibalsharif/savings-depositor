CREATE TABLE "notification_recipients" (
	"id" serial PRIMARY KEY NOT NULL,
	"notification_id" uuid NOT NULL,
	"recipient_user_id" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "title" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "related_entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "recipient_user_id";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "is_read";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "role_target";--> statement-breakpoint
ALTER TABLE "notifications" DROP COLUMN "action_required";