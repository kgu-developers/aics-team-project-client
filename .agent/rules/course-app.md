# OOP Course App Rule

Use this rule for `apps/oop` work.

## Default target

Unless the user explicitly says shared package, repo tooling, or another future course, assume product work belongs to `apps/oop`.

## Course routing policy

`apps/oop` is already the OOP course app.

Do not create these routes unless a later ticket explicitly changes the product scope:

- `/courses`
- `/courses/[courseId]`
- `/course-offerings`
- `/course-offerings/[courseOfferingId]`

Course remains as the existing domain/config concept:

- `apps/oop/src/course/config.ts`
- `apps/oop/src/course/navigation.ts`
- `packages/core/src/course`

Do not introduce `CourseOffering` by default. Keep the existing `Course` domain unless a future ticket explicitly expands the app into multi-semester or multi-course management inside one app.

The user-facing operational axis starts from `section` / 분반, not from course selection.

Preferred flow:

```text
Course(config/domain)
  -> Section
    -> Team
      -> Project
        -> Milestone
          -> Submission
            -> Review/Rubric
```

## Placement guidance

- Course-specific configuration, copy, templates, rubrics, and special components belong under `apps/oop/src/course`.
- Route assembly belongs under `apps/oop/src/app`.
- App-domain code can use the OOP-local `entities`, `features`, `widgets`, and `shared` folders described in `.agent/rules/file-structure.md`.
- Do not create `apps/database` or another course app until there is a real ticket.
- Do not move OOP code into `packages/*` until there is a clear second use case.

## Verification focus

- OOP is the first deployed surface, so verify the route builds and the app shell renders.
- Prefer repo-wide `pnpm lint` and `pnpm build` before handoff for early bootstrap work.
