ALTER TABLE "tournaments" ADD COLUMN "rounds_started" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tournaments" DROP COLUMN "max_players";