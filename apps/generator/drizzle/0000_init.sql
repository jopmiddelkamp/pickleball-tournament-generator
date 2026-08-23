CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"participant_token" text,
	"name" text NOT NULL,
	"gender" text NOT NULL,
	"level" integer NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "registrations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organiser_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"max_players" integer NOT NULL,
	"max_courts" integer NOT NULL,
	"rounds" integer NOT NULL,
	"game_target" integer NOT NULL,
	"algorithm_id" text NOT NULL,
	"seed" bigint NOT NULL,
	"courts" integer,
	"rest_slots" integer,
	"registration_closed_at" timestamp with time zone,
	"schedule" jsonb,
	"games" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tournaments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registrations_tournament_idx" ON "registrations" USING btree ("tournament_id","registered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_active_token_idx" ON "registrations" USING btree ("tournament_id","participant_token") WHERE cancelled_at is null and participant_token is not null;--> statement-breakpoint
CREATE INDEX "tournaments_organiser_idx" ON "tournaments" USING btree ("organiser_id","created_at");