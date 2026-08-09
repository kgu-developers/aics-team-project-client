# Product and file structure

This is the single source of truth for product boundaries and code placement.

## Product boundary

- This is a course team-project operation tool, not an LMS replacement.
- OOP is the first concrete course app. Do not create another course app without an explicit ticket.
- The operational flow is Course(config/domain) → Section → Team → Project → Milestone → Submission → Review/Rubric.
- `section` / 분반 is a first-class domain. User-facing operation starts from section, not course selection.
- Do not add `/courses`, `/course-offerings`, or `CourseOffering` unless a ticket expands the product to multi-course or multi-semester management.

## Placement order

Choose the first matching destination:

1. Route declaration, route guard wiring, shell selection, or page composition → `apps/oop/src/app`
2. OOP config, navigation, copy, rubric, or static course template → `apps/oop/src/course`
3. OOP domain representation/model/UI → `apps/oop/src/entities/<domain>`
4. User action or workflow → `apps/oop/src/features/<feature>`
5. Composed page section or dashboard → `apps/oop/src/widgets/<widget>`
6. OOP-only helper, constant, config, or small UI → `apps/oop/src/shared`
7. Shared pure domain type or logic → `packages/core`
8. Axios client, endpoint, API function, or response mapper → `packages/api-client`
9. Astryx dependency, theme/provider, CSS import order, token contract, or audited re-export → `packages/design-system`

Routes assemble; they do not own API calls, fixtures, complex forms, or domain workflows.

## Create on demand

FSD is a placement vocabulary, not a directory template.

- Create a directory with its first implemented source file, not from a PRD item alone.
- Remove an empty directory when its final source file is removed.
- Keep OOP-only code in `apps/oop`; one use is not evidence of cross-app reuse.
- Propose a new shared package only after a verified second course-app use case or an explicit extraction ticket. Do not assume a future package name or create an empty package boundary.
- Explain package promotion in the task card, worklog, or final handoff when applicable.

## Route skeletons

- A durable navigation destination or independently owned page may become a route.
- Action-like PRD nodes usually remain actions/TODOs inside a page until implemented.
- Placeholder routes may contain a title, description, and clearly scoped TODOs during structure alignment.

