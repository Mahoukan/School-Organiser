CREATE TABLE "dated_events" (
	"id" varchar(120) PRIMARY KEY NOT NULL,
	"user_id" varchar(80) NOT NULL,
	"academic_year_id" varchar(80) NOT NULL,
	"date" date NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(100) NOT NULL,
	"detail" varchar(500) DEFAULT '' NOT NULL,
	"location" varchar(100) DEFAULT '' NOT NULL,
	"colour" varchar(20) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dated_event_type_check" CHECK ("dated_events"."type" in ('duty','meeting','assembly','tutor-form','club','appointment','other')),
	CONSTRAINT "dated_event_time_order_check" CHECK ("dated_events"."start_time" < "dated_events"."end_time")
);
--> statement-breakpoint
ALTER TABLE "dated_events" ADD CONSTRAINT "dated_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dated_events" ADD CONSTRAINT "dated_events_academic_year_id_academic_years_id_fk" FOREIGN KEY ("academic_year_id") REFERENCES "public"."academic_years"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dated_event_user_date_idx" ON "dated_events" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "dated_event_year_date_idx" ON "dated_events" USING btree ("academic_year_id","date");
