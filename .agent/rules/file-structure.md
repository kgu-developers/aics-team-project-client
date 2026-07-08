# File structure

This folder structure is not only a map. It is a placement decision rule for agents.

When adding or moving code, decide what kind of change it is before editing files. Do not create a folder just because it sounds reusable.

## OOP app structure

`apps/oop` is the first concrete course app. The app itself is already the OOP course context.

Do not create these routes inside `apps/oop` unless a later ticket explicitly changes the product scope:

- `/courses`
- `/courses/[courseId]`
- `/course-offerings`
- `/course-offerings/[courseOfferingId]`

Keep `Course` as the existing domain/config concept. Do not introduce `CourseOffering` unless a later ticket explicitly expands the product into multi-semester or multi-course management inside one app.

User-facing operation starts from `section` / 분반, not from course selection.

Preferred domain flow:

```text
Course(config/domain)
  -> Section
    -> Team
      -> Project
        -> Milestone
          -> Submission
            -> Review/Rubric
```

## Placement decision order

Choose the destination in this order:

1. URL/page entry, route layout, loading/error/not-found, or page-level composition
   - `apps/oop/src/app`

2. OOP course config, navigation, copy, static templates, rubrics, and OOP-special components
   - `apps/oop/src/course`

3. OOP app domain representation or domain-local UI/model code
   - `apps/oop/src/entities/<domain>`
   - Current domains: `course`, `section`, `team`, `member`, `project`, `milestone`, `submission`, `review`, `rubric`, `notification`

4. User action or workflow
   - `apps/oop/src/features/<feature>`
   - Examples: `team-upload`, `submission-review`, `grading`, `peer-review`, `notification-read`

5. Composed page section assembled from entities/features
   - `apps/oop/src/widgets/<widget>`
   - Examples: `professor-dashboard`, `assistant-dashboard`, `student-dashboard`, `team-summary`, `submission-summary`

6. OOP-only shared helper, config, constant, small UI, or library code
   - `apps/oop/src/shared`

7. Pure domain type or logic that is clearly shared across future course apps
   - `packages/core`

8. API client, axios instance, request/response mapper, query boundary, or mock/real adapter boundary
   - `packages/api-client`
   - Do not scatter direct axios calls inside app components.

9. Reusable team-project template/block with a clear second course use case
   - `packages/team-project-kit`

10. Domain-neutral UI primitive or generic Loading/Error/Empty state
    - `packages/ui`

## Route skeleton policy

The PRD-based route skeleton is intentionally shallow placeholder work.

- Route pages may contain title, description, and TODOs while the team is aligning structure.
- Action-like PRD nodes usually stay as TODOs inside a page instead of becoming their own route.
  - Examples: 공개/비공개 전환, 피드백 작성, 내부 메모 작성, 수정 요청, 성적 확정, 알림 읽음 처리.
- A new route is justified when a teammate can own it as a page-level task or when the URL represents a durable navigation destination.

## Promotion rule

Do not move OOP code to `packages/*` after only one use.

Promote only when at least one is true:

- a second course app actually needs the code;
- a ticket explicitly asks for shared package extraction;
- the code is domain-neutral infrastructure such as API client or UI primitive.

When editing `packages/*`, the task card or worklog must explain the reuse reason.
