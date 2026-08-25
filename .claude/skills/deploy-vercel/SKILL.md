---
name: deploy-vercel
description: Ship the generator to production on Vercel. Use when asked to deploy, release, ship, push live, or "is it deployed" — and after any push to master, because pushing alone deploys nothing here.
---

# Deploying the generator

Production is Vercel project `pickleball-generator` on team `jm-8d10`, live at https://pickleball-generator-eta.vercel.app. **The project has no Git integration.** Pushing to `master` does not build anything; every production deploy is a CLI upload from this machine. If someone asks whether a change is deployed, the answer is "not until `vercel deploy --prod` ran", whatever `git log` says.

## The steps

1. Commit and push first, so what is live matches a commit someone can find.
2. If the change added a migration under `apps/generator/drizzle/`, run `pnpm db:migrate:cloud` before deploying. It reads the git-ignored cloud env file and runs Drizzle against the production database; the app on Vercel has no migration step of its own. Skip this when there is no new migration.
3. From the repo root: `vercel deploy --prod --yes`. Takes about a minute. Read its output in full (`| tail -15`, never a `grep` that can hide an error); it prints the deployment URL and then `Aliased https://pickleball-generator-eta.vercel.app`, and the alias line is the one that means production moved. If in doubt, `vercel ls pickleball-generator` — the first row must be a new deployment, and `vercel inspect <that url>` must say `target production`.
4. Verify without secrets: `curl -s -o /dev/null -w '%{http_code}' https://pickleball-generator-eta.vercel.app/design` (200, public) and `/organiser/login` (200). A public event page from the local seed will 404 in production; that is a different database, not a broken deploy.

## What the project is set to

Read with `vercel project inspect pickleball-generator`. Root directory `apps/generator`; install `cd ../.. && pnpm install --frozen-lockfile`; build `cd ../.. && pnpm turbo run build --filter=@ptg/generator`; Node 24. The CLI is already logged in and `.vercel/project.json` (git-ignored) pins the project, so no `vercel link` is needed.

## Things that have gone wrong, and why

**"File size limit exceeded (100 MB)" while uploading ~1 GB.** The CLI uploads from the repo root and does not apply nested `.gitignore` patterns, so `.turbo/cache` and `apps/generator/.next` were being sent. `.vercelignore` at the root now excludes them; if the upload is ever large again, something new is being caught, and `du -sh` on the top-level directories finds it in seconds.

**Build fails with `Can't resolve '../supabase/server'`.** A `.vercelignore` line `supabase` also matched `apps/generator/lib/supabase/`. Patterns meant for the root Supabase CLI folder are anchored as `/supabase`; keep it that way when adding entries.

**Turbo warns that environment variables set on Vercel are missing from `turbo.json`.** Benign. `turbo.json`'s `globalEnv` lists the variables the app reads (`POSTGRES_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, …); the warning is about extra variables the Vercel integration sets that nothing here uses, and `lib/env.ts` reads its variables at request time, not at build time. Do not "fix" it by adding `NEXT_PUBLIC_*` variables — none exist.

**The Vercel MCP connector returns 403.** It has no permission on this team. Use the CLI: `vercel ls pickleball-generator` for recent deploys, `vercel inspect <url> --logs` for a failed build's output, grepping for `Module not found`, `Type error` or `exited with`.

**A tool call gets denied for mentioning an env file.** `.claude/hooks/protect-env.sh` blocks any command or file operation whose text references a dotenv file other than the example one — including a `gh api` call whose URL happens to contain the token. Rephrase the command; do not disable the hook.

## Not part of a deploy

Auth is configured in the Supabase dashboard and Google Cloud console, not on Vercel; nothing about sign-in changes when you deploy. The bench app is internal and never deployed.
