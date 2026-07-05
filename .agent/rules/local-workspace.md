# Local Workspace Rule

`.agent-local/` is the only place for temporary or personal agent artifacts.

## Allowed local-only artifacts

```text
.agent-local/
  task-cards/
  worklogs/
  pr-drafts/
  review-fixes/
  screenshots/
  proposals/
  coaching-notes/
```

## Rules

- Never commit `.agent-local/`.
- Do not put personal coaching notes into `.agent/rules/`.
- Team-learning proposals start in `.agent-local/proposals/` and move to shared rules or Notion only after explicit approval.
- If a task creates local artifacts, mention their path in the final report.
