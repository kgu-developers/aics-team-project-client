# Repo map

- `apps/oop`: OOP app routes, course config, course copy, course-specific templates/components, and deployment settings.
- `packages/core`: shared domain types and pure logic. Core domains include course, section, team, member, project, milestone, submission, review, and rubric.
- `packages/api-client`: axios client, endpoint constants, and API functions. Do not scatter direct axios calls inside components.
- `packages/design-system`: Astryx dependency/theme/provider/re-export integration boundary; not an OOP component catalog.
- Add a shared UI or team-project template package only after a verified second course-app use case.
- `configs/typescript`: shared TypeScript configs.
- `.agent`: shared repo-local agent skill pack.
- `.agent-local`: private local agent workspace; never commit.
