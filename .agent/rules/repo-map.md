# Repo map

- `apps/oop`: OOP app routes, course config, course copy, course-specific templates/components, and deployment settings.
- `packages/ui`: domain-neutral UI primitives and common Loading/Error/Empty states.
- `packages/core`: shared domain types and pure logic. Core domains include course, section, team, member, project, milestone, submission, review, and rubric.
- `packages/api-client`: axios client and API functions. Do not scatter direct axios calls inside components.
- `packages/team-project-kit`: reusable team-project templates and blocks that could serve more than one course app.
- `configs/typescript`: shared TypeScript configs.
- `.agent`: shared repo-local agent skill pack.
- `.agent-local`: private local agent workspace; never commit.
