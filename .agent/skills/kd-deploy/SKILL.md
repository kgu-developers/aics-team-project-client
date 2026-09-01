---
name: kd-deploy
description: Trigger on OOP production release requests such as 배포해줘, 운영 반영해줘, 배포 전 점검해줘, 릴리즈 확인해줘, or Cloudflare Pages 배포.
---

# KD/AICS OOP Production Deploy Skill

## Purpose

Deploy the OOP frontend to the existing `aics-oop` Cloudflare Pages Direct Upload
project while preserving human approval, exact commit traceability, and post-deploy evidence.
This skill covers production readiness checks and production deployment. It does not
create Preview environments, change DNS, deploy the Workers fallback, or roll back a
deployment unless the user explicitly requests that separate action.

## Sources to read

1. Read `.agent/rules/workflow.md` for Git, authorization, and local-artifact rules.
2. Inspect `apps/oop/package.json`, `apps/oop/.env.production`, and the current diff.
3. If `.agent-local/sources/oop-cloudflare-pages-handover.md` exists, read only the
   sections needed for the current incident or deployment. Its absence is not a blocker;
   the required release invariants are self-contained here.

## Authorization boundary

- A request to inspect, test, or prepare a release does not authorize an upload.
- Run the actual Pages deployment only when the user explicitly asks to deploy or
  publish to production.
- Do not push, merge, change DNS, change Cloudflare project settings, rotate credentials,
  deploy the Workers fallback, or roll back as an implied part of deployment.
- Never print Wrangler credentials, tokens, profiles, or private local source contents.

## Production invariants

- Deploy only the exact `origin/main` commit from a clean `main` worktree.
- Fetch `origin` immediately before comparing `HEAD` with `origin/main`.
- Do not switch branches in a dirty worktree. Stop and use a separate clean worktree or
  ask the user how to proceed.
- The target is the existing Pages project `aics-oop`, production branch `main`, using
  the KGU team Wrangler profile configured by `apps/oop/package.json`.
- `apps/oop/.env.production` must contain an HTTPS `VITE_API_BASE_URL` and no secret.
- Local Vite env files and ambient `VITE_*` values must not override the tracked
  production configuration.
- The Vite build must reject any production chunk containing a
  `@tanstack/router-devtools` module, and the deploy preflight must also find no known
  Devtools UI marker in the built artifact.
- Treat frontend rendering and backend CORS/login/session health as separate checks.

## Workflow

### 1. Establish the release target

Record the requested ticket or release scope, current branch, `git status --short`, and
candidate commit SHA. Confirm backend readiness or deployment order when the release
depends on an API change.

### 2. Verify without uploading

From the repository root, run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm --filter @aics/oop test
pnpm agent:deploy:preflight
```

`agent:deploy:preflight` fetches `origin`, then rejects a non-`main` branch, a dirty
worktree, a commit that differs from `origin/main`, an unexpected or unsafe production
environment variable, an altered Pages target, a missing build, and Router Devtools code
in the production bundle. On a feature branch, use
`pnpm agent:deploy:check-bundle` only to verify the build invariant; it never authorizes
production deployment.

If a command fails, stop before upload and report the concrete failure. Do not weaken or
bypass the preflight to make a deployment proceed.

### 3. Upload only after explicit authorization

Run:

```bash
pnpm --filter @aics/oop run deploy
```

The package script rebuilds and reruns the full preflight before Wrangler uploads
`apps/oop/dist`. Capture the deployed commit SHA and Wrangler deployment URL or ID.
Do not automatically retry a failed or ambiguous upload; diagnose it and get the user's
direction before another production mutation.

### 4. Verify the live deployment

Check the production `/` and `/login` routes over HTTPS, a direct SPA route, asset load
failures, and browser console errors. When test credentials and permission are available,
also verify login, refresh-based session restoration, and one representative student or
admin route. Never turn a read-only smoke check into production data mutation without
explicit scope.

### 5. Record evidence

Write `.agent-local/worklogs/deploy-<commit>.md` with deployment time, operator, commit
SHA, included tickets, commands and results, deployment URL/ID, smoke-test results, and
unresolved backend or CORS risks. Never commit this worklog.

## Completion standard

A deployment is complete only when the exact commit is traceable, the upload succeeded,
the live SPA routes load, Router Devtools are absent, and any unverified login/session
work is clearly separated from passed frontend checks.
