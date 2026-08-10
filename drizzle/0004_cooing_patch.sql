CREATE TABLE "user_preferences" (
	"user_id" varchar(80) PRIMARY KEY NOT NULL,
	"theme" varchar(10) DEFAULT 'system' NOT NULL,
	"accent_colour" varchar(10) DEFAULT 'blue' NOT NULL,
	"density" varchar(12) DEFAULT 'comfortable' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_theme_check" CHECK ("user_preferences"."theme" in ('system','light','dark')),
	CONSTRAINT "user_preferences_accent_check" CHECK ("user_preferences"."accent_colour" in ('blue','indigo','purple','teal','green','orange','rose')),
	CONSTRAINT "user_preferences_density_check" CHECK ("user_preferences"."density" in ('comfortable','compact'))
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;