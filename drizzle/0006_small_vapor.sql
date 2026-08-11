ALTER TABLE "user_preferences" DROP CONSTRAINT "user_preferences_accent_check";--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "highlight_colour" varchar(10) DEFAULT 'same' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "neutral_tone" varchar(10) DEFAULT 'cool' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "interface_font" varchar(20) DEFAULT 'system' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "heading_font" varchar(20) DEFAULT 'same' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD COLUMN "content_font" varchar(20) DEFAULT 'same' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_highlight_check" CHECK ("user_preferences"."highlight_colour" in ('same','blue','sky','cyan','teal','emerald','green','lime','amber','orange','rose','pink','fuchsia','purple','violet','indigo'));--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_neutral_tone_check" CHECK ("user_preferences"."neutral_tone" in ('cool','neutral','warm'));--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_interface_font_check" CHECK ("user_preferences"."interface_font" in ('system','inter','source-sans-3','open-sans','nunito-sans','roboto','lato'));--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_heading_font_check" CHECK ("user_preferences"."heading_font" in ('same','inter','source-sans-3','nunito-sans','lora','merriweather','roboto-slab'));--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_content_font_check" CHECK ("user_preferences"."content_font" in ('same','inter','source-sans-3','open-sans','lora','merriweather'));--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_accent_check" CHECK ("user_preferences"."accent_colour" in ('blue','sky','cyan','teal','emerald','green','lime','amber','orange','rose','pink','fuchsia','purple','violet','indigo'));