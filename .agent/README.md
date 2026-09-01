# AICS Agent Harness

This thin harness helps AI coding agents keep KD/AICS conventions close to the repo.

Humans should not need to memorize commands. Agents read `AGENTS.md`, route the most specific natural-language request to `.agent/skills/*/SKILL.md`, and load only the relevant source-of-truth rules. UI/Astryx work follows `design-system.md` and `astryx-inventory.md`; package-level changes also read `packages/design-system/AGENTS.md`.

Swagger/OpenAPI refreshes and frontend/MSW contract audits route through `kd-api-contract`.
The skill discovers raw document groups from Swagger UI configuration and keeps snapshots,
deployment evidence, and audit reports local-only.

## Local-only workspace

Use `.agent-local/` for:

- task cards generated from vague requests;
- worklogs and verification evidence;
- PR drafts before human review;
- screenshot plans and screenshot notes;
- personal coaching notes;
- team-learning proposals before approval.
- private PRD pointers and local caches.
- OpenAPI source pointers, snapshots, deployment evidence, and contract audits.
- private operational handover and infrastructure reference documents.

`.agent-local/` is intentionally gitignored. Shared team rules move into `.agent/rules/` only after human approval.
