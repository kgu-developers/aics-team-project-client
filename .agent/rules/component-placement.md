# Component placement

Use `.agent/rules/file-structure.md` first for the full placement decision tree.

## Common destinations

- Route assembly/page composition: `apps/oop/src/app` or page-level folders.
- OOP-only course config/copy/special component: `apps/oop/src/course`.
- OOP domain representation: `apps/oop/src/entities/<domain>`.
- User workflow/action component: `apps/oop/src/features/<feature>`.
- Composed page section/dashboard/summary: `apps/oop/src/widgets/<widget>`.
- OOP-only shared helper/UI/config: `apps/oop/src/shared`.
- Add a shared UI or team-project template package only after a verified second course use case.

Do not move OOP-only code to `packages/*` just because it may become reusable later. Wait for a second course app or an explicit extraction ticket.
