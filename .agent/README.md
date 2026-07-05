# AICS Agent Harness

This thin harness helps AI coding agents keep KD/AICS conventions close to the repo.

Humans should not need to memorize commands. Agents should read `AGENTS.md`, then route natural-language requests to `.agent/skills/*/SKILL.md`, read the relevant `.agent/rules/*`, and write temporary artifacts under `.agent-local/`.

## Local-only workspace

Use `.agent-local/` for:

- task cards generated from vague requests;
- worklogs and verification evidence;
- PR drafts before human review;
- screenshot plans and screenshot notes;
- personal coaching notes;
- team-learning proposals before approval.

`.agent-local/` is intentionally gitignored. Shared team rules move into `.agent/rules/` only after human approval.
