CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent');--> statement-breakpoint
CREATE TYPE "public"."production_module" AS ENUM('scanning', 'batch');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('scanning_supervisor', 'batch_supervisor', 'dispatch_supervisor', 'hod', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "attendance" (
	"date" date NOT NULL,
	"employee_id" text NOT NULL,
	"status" "attendance_status" NOT NULL,
	"checked_in_at" timestamp with time zone,
	"marked_by" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_date_employee_id_pk" PRIMARY KEY("date","employee_id")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hourly_entries" (
	"day_id" integer NOT NULL,
	"slot_id" text NOT NULL,
	"achieved" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hourly_entries_day_id_slot_id_pk" PRIMARY KEY("day_id","slot_id"),
	CONSTRAINT "achieved_non_negative" CHECK ("hourly_entries"."achieved" >= 0)
);
--> statement-breakpoint
CREATE TABLE "production_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"module" "production_module" NOT NULL,
	"date" date NOT NULL,
	"daily_target" integer NOT NULL,
	"supervisor" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_days_module_date_unique" UNIQUE("module","date"),
	CONSTRAINT "daily_target_positive" CHECK ("production_days"."daily_target" > 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"username" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" "role" NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"password_hash" text NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hourly_entries" ADD CONSTRAINT "hourly_entries_day_id_production_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."production_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_days" ADD CONSTRAINT "production_days_supervisor_users_username_fk" FOREIGN KEY ("supervisor") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "production_days_date_index" ON "production_days" USING btree ("date");