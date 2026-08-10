CREATE TABLE "day_timetable_assignments" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"cycle_week" varchar(1) NOT NULL,
	"weekday" varchar(12) NOT NULL,
	"template_id" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_template_assignment_cycle_check" CHECK ("day_timetable_assignments"."cycle_week" in ('A','B'))
);
--> statement-breakpoint
CREATE TABLE "day_timetable_template_blocks" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"template_id" varchar(120) NOT NULL,
	"name" varchar(40) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"display_order" integer NOT NULL,
	"is_teaching" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "day_template_block_time_order_check" CHECK ("day_timetable_template_blocks"."start_time" < "day_timetable_template_blocks"."end_time"),
	CONSTRAINT "day_template_block_order_check" CHECK ("day_timetable_template_blocks"."display_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "day_timetable_templates" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"name" varchar(80) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "period_blocks" ADD COLUMN "template_block_id" varchar(120);--> statement-breakpoint
INSERT INTO "day_timetable_templates" ("id", "user_id", "academic_year_id", "name")
SELECT 'migrated-template-' || md5("user_id" || ':' || "academic_year_id" || ':' || "cycle_week" || ':' || "weekday"), "user_id", "academic_year_id", 'Week ' || "cycle_week" || ' ' || initcap("weekday")
FROM "period_blocks"
GROUP BY "user_id", "academic_year_id", "cycle_week", "weekday";--> statement-breakpoint
INSERT INTO "day_timetable_template_blocks" ("id", "template_id", "name", "start_time", "end_time", "display_order", "is_teaching", "created_at", "updated_at")
SELECT 'migrated-block-' || md5("id"), 'migrated-template-' || md5("user_id" || ':' || "academic_year_id" || ':' || "cycle_week" || ':' || "weekday"), "name", "start_time", "end_time", "display_order", "is_teaching", "created_at", "updated_at"
FROM "period_blocks";--> statement-breakpoint
INSERT INTO "day_timetable_assignments" ("id", "user_id", "academic_year_id", "cycle_week", "weekday", "template_id")
SELECT 'migrated-assignment-' || md5("user_id" || ':' || "academic_year_id" || ':' || "cycle_week" || ':' || "weekday"), "user_id", "academic_year_id", "cycle_week", "weekday", 'migrated-template-' || md5("user_id" || ':' || "academic_year_id" || ':' || "cycle_week" || ':' || "weekday")
FROM "period_blocks"
GROUP BY "user_id", "academic_year_id", "cycle_week", "weekday";--> statement-breakpoint
UPDATE "period_blocks" SET "template_block_id" = 'migrated-block-' || md5("id");--> statement-breakpoint
ALTER TABLE "period_blocks" ALTER COLUMN "template_block_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "day_timetable_assignments" ADD CONSTRAINT "day_timetable_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_timetable_assignments" ADD CONSTRAINT "day_timetable_assignments_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_timetable_assignments" ADD CONSTRAINT "day_timetable_assignments_template_id_day_timetable_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."day_timetable_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_timetable_template_blocks" ADD CONSTRAINT "day_timetable_template_blocks_template_id_day_timetable_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."day_timetable_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_timetable_templates" ADD CONSTRAINT "day_timetable_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_timetable_templates" ADD CONSTRAINT "day_timetable_templates_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "day_template_assignment_slot_unique" ON "day_timetable_assignments" USING btree ("user_id","academic_year_id","cycle_week","weekday");--> statement-breakpoint
CREATE INDEX "day_template_assignment_template_idx" ON "day_timetable_assignments" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "day_template_block_name_unique" ON "day_timetable_template_blocks" USING btree ("template_id",lower("name"));--> statement-breakpoint
CREATE INDEX "day_template_block_template_idx" ON "day_timetable_template_blocks" USING btree ("template_id");--> statement-breakpoint
CREATE UNIQUE INDEX "day_template_user_year_name_unique" ON "day_timetable_templates" USING btree ("user_id","academic_year_id",lower("name"));--> statement-breakpoint
CREATE INDEX "day_template_user_year_idx" ON "day_timetable_templates" USING btree ("user_id","academic_year_id");--> statement-breakpoint
ALTER TABLE "period_blocks" ADD CONSTRAINT "period_blocks_template_block_id_day_timetable_template_blocks_id_fk" FOREIGN KEY ("template_block_id") REFERENCES "public"."day_timetable_template_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "period_template_block_idx" ON "period_blocks" USING btree ("template_block_id");
