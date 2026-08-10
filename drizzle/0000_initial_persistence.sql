CREATE TABLE "academic_years" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"year" integer NOT NULL,
	"name" varchar(80) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_exceptions" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"type" varchar(40) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "calendar_exception_dates_check" CHECK ("calendar_exceptions"."start_date" <= "calendar_exceptions"."end_date")
);
--> statement-breakpoint
CREATE TABLE "class_absence_classes" (
	"class_absence_id" varchar(120) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	CONSTRAINT "class_absence_classes_class_absence_id_class_id_pk" PRIMARY KEY("class_absence_id","class_id")
);
--> statement-breakpoint
CREATE TABLE "class_absences" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "class_absence_dates_check" CHECK ("class_absences"."start_date" <= "class_absences"."end_date")
);
--> statement-breakpoint
CREATE TABLE "classes" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"short_code" varchar(30) NOT NULL,
	"subject" varchar(100) DEFAULT '' NOT NULL,
	"year_level" varchar(30) DEFAULT '' NOT NULL,
	"room" varchar(50) DEFAULT '' NOT NULL,
	"colour" varchar(20) NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_movements" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"date" date NOT NULL,
	"recurring_assignment_id" varchar(120) NOT NULL,
	"destination_period_id" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_occurrences" (
	"id" varchar(220) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"date" date NOT NULL,
	"recurring_assignment_id" varchar(120) NOT NULL,
	"class_id" varchar(100) NOT NULL,
	"period_id" varchar(120),
	"title" varchar(100) DEFAULT '' NOT NULL,
	"summary" varchar(160) DEFAULT '' NOT NULL,
	"plan" text DEFAULT '' NOT NULL,
	"status" varchar(30) DEFAULT 'planned' NOT NULL,
	"cancellation_reason" varchar(40) DEFAULT '' NOT NULL,
	"cancellation_note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_status_check" CHECK ("lesson_occurrences"."status" in ('planned','completed','partially-completed','cancelled'))
);
--> statement-breakpoint
CREATE TABLE "period_blocks" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"cycle_week" varchar(1) NOT NULL,
	"weekday" varchar(12) NOT NULL,
	"name" varchar(40) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"display_order" integer NOT NULL,
	"is_teaching" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "period_cycle_check" CHECK ("period_blocks"."cycle_week" in ('A','B')),
	CONSTRAINT "period_time_order_check" CHECK ("period_blocks"."start_time" < "period_blocks"."end_time")
);
--> statement-breakpoint
CREATE TABLE "recurring_timetable_items" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"class_id" varchar(100),
	"event_type" varchar(30),
	"title" varchar(100),
	"detail" varchar(160),
	"colour" varchar(20),
	"cycle_week" varchar(1) NOT NULL,
	"weekday" varchar(12) NOT NULL,
	"period_id" varchar(120) NOT NULL,
	"effective_from_date" date NOT NULL,
	"effective_to_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_kind_check" CHECK ("recurring_timetable_items"."kind" in ('class','event')),
	CONSTRAINT "recurring_cycle_check" CHECK ("recurring_timetable_items"."cycle_week" in ('A','B')),
	CONSTRAINT "recurring_shape_check" CHECK (("recurring_timetable_items"."kind" = 'class' and "recurring_timetable_items"."class_id" is not null and "recurring_timetable_items"."event_type" is null) or ("recurring_timetable_items"."kind" = 'event' and "recurring_timetable_items"."class_id" is null and "recurring_timetable_items"."event_type" is not null and "recurring_timetable_items"."title" is not null and "recurring_timetable_items"."colour" is not null)),
	CONSTRAINT "recurring_dates_check" CHECK ("recurring_timetable_items"."effective_to_date" is null or "recurring_timetable_items"."effective_from_date" <= "recurring_timetable_items"."effective_to_date")
);
--> statement-breakpoint
CREATE TABLE "teacher_absences" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"note" varchar(200) DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teacher_absence_dates_check" CHECK ("teacher_absences"."start_date" <= "teacher_absences"."end_date")
);
--> statement-breakpoint
CREATE TABLE "teaching_weeks" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"term_id" varchar(100) NOT NULL,
	"week_start_date" date NOT NULL,
	"cycle_week" varchar(1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teaching_week_cycle_check" CHECK ("teaching_weeks"."cycle_week" in ('A','B'))
);
--> statement-breakpoint
CREATE TABLE "terms" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"name" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "term_date_order_check" CHECK ("terms"."start_date" <= "terms"."end_date")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(80) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_exceptions" ADD CONSTRAINT "calendar_exceptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_absence_classes" ADD CONSTRAINT "class_absence_classes_class_absence_id_class_absences_id_fk" FOREIGN KEY ("class_absence_id") REFERENCES "public"."class_absences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_absence_classes" ADD CONSTRAINT "class_absence_classes_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_absences" ADD CONSTRAINT "class_absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_movements" ADD CONSTRAINT "lesson_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_movements" ADD CONSTRAINT "lesson_movements_recurring_assignment_id_recurring_timetable_items_id_fk" FOREIGN KEY ("recurring_assignment_id") REFERENCES "public"."recurring_timetable_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_movements" ADD CONSTRAINT "lesson_movements_destination_period_id_period_blocks_id_fk" FOREIGN KEY ("destination_period_id") REFERENCES "public"."period_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_occurrences" ADD CONSTRAINT "lesson_occurrences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_occurrences" ADD CONSTRAINT "lesson_occurrences_recurring_assignment_id_recurring_timetable_items_id_fk" FOREIGN KEY ("recurring_assignment_id") REFERENCES "public"."recurring_timetable_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_occurrences" ADD CONSTRAINT "lesson_occurrences_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_occurrences" ADD CONSTRAINT "lesson_occurrences_period_id_period_blocks_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."period_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_blocks" ADD CONSTRAINT "period_blocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "period_blocks" ADD CONSTRAINT "period_blocks_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_timetable_items" ADD CONSTRAINT "recurring_timetable_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_timetable_items" ADD CONSTRAINT "recurring_timetable_items_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_timetable_items" ADD CONSTRAINT "recurring_timetable_items_class_id_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_timetable_items" ADD CONSTRAINT "recurring_timetable_items_period_id_period_blocks_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."period_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_absences" ADD CONSTRAINT "teacher_absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teaching_weeks" ADD CONSTRAINT "teaching_weeks_term_id_terms_id_fk" FOREIGN KEY ("term_id") REFERENCES "public"."terms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms" ADD CONSTRAINT "terms_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_year_user_year_unique" ON "academic_years" USING btree ("user_id","year");--> statement-breakpoint
CREATE INDEX "academic_year_user_idx" ON "academic_years" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "calendar_exception_user_dates_idx" ON "calendar_exceptions" USING btree ("user_id","start_date","end_date");--> statement-breakpoint
CREATE INDEX "class_absence_user_dates_idx" ON "class_absences" USING btree ("user_id","start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "class_user_year_shortcode_unique" ON "classes" USING btree ("user_id","academic_year_id",lower("short_code"));--> statement-breakpoint
CREATE INDEX "class_user_idx" ON "classes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "movement_user_date_assignment_unique" ON "lesson_movements" USING btree ("user_id","date","recurring_assignment_id");--> statement-breakpoint
CREATE INDEX "movement_date_idx" ON "lesson_movements" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_user_date_assignment_unique" ON "lesson_occurrences" USING btree ("user_id","date","recurring_assignment_id");--> statement-breakpoint
CREATE INDEX "lesson_date_class_idx" ON "lesson_occurrences" USING btree ("date","class_id");--> statement-breakpoint
CREATE UNIQUE INDEX "period_day_name_unique" ON "period_blocks" USING btree ("academic_year_id","cycle_week","weekday",lower("name"));--> statement-breakpoint
CREATE INDEX "period_day_idx" ON "period_blocks" USING btree ("academic_year_id","cycle_week","weekday");--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_active_slot_unique" ON "recurring_timetable_items" USING btree ("academic_year_id","cycle_week","weekday","period_id") WHERE "recurring_timetable_items"."effective_to_date" is null;--> statement-breakpoint
CREATE INDEX "recurring_user_idx" ON "recurring_timetable_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_class_dates_idx" ON "recurring_timetable_items" USING btree ("class_id","effective_from_date","effective_to_date");--> statement-breakpoint
CREATE INDEX "teacher_absence_user_dates_idx" ON "teacher_absences" USING btree ("user_id","start_date","end_date");--> statement-breakpoint
CREATE UNIQUE INDEX "teaching_week_term_date_unique" ON "teaching_weeks" USING btree ("term_id","week_start_date");--> statement-breakpoint
CREATE INDEX "teaching_week_date_idx" ON "teaching_weeks" USING btree ("week_start_date");--> statement-breakpoint
CREATE INDEX "term_year_idx" ON "terms" USING btree ("academic_year_id");