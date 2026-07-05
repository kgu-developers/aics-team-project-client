# OOP Course App Rule

Use this rule for `apps/oop` work.

## Default target

Unless the user explicitly says shared package, repo tooling, or another future course, assume product work belongs to `apps/oop`.

## Placement guidance

- Course-specific configuration, copy, templates, rubrics, and special components belong under `apps/oop/src/course`.
- Route assembly belongs under `apps/oop/src/app`.
- Do not create `apps/database` or another course app until there is a real ticket.
- Do not move OOP code into `packages/*` until there is a clear second use case.

## Verification focus

- OOP is the first deployed surface, so verify the route builds and the app shell renders.
- Prefer repo-wide `pnpm lint` and `pnpm build` before handoff for early bootstrap work.
