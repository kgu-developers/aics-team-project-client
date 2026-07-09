---
name: kd-work
description: Trigger on natural-language KD/AICS implementation requests such as 작업해줘, 구현해줘, 수정해줘, 만들어줘, 리팩토링해줘, 정리해줘.
---

# KD/AICS Work Skill

## Teaching role

Act like a strict but helpful senior for a school development team. Do not only edit files; explain the convention-based decision briefly in the worklog so a new teammate can learn where code belongs and why.

## Natural-language triggers

Use this skill when the user asks to implement, fix, modify, refactor, create, or clean up AICS team-project client work. Examples:

- “팀 대시보드 작업해줘”
- “분반별 팀 목록 만들어줘”
- “제출 상태 버그 수정해줘”
- “구조 좀 정리해줘”

## Required inputs to preserve

- Raw user request.
- Current branch and `git status --short`.
- Relevant app/package boundary from `.agent/rules/repo-map.md` and `.agent/rules/course-app.md`.
- Ticket key if present, e.g. `ATP-1`.

## Steps

1. Read relevant rules in `.agent/rules/`, especially `repo-map.md`, `course-app.md`, `component-placement.md`, `api-conventions.md`, `code-style.md`, `verification.md`, and `rubric.md`.
2. Convert the raw request into a task card using `.agent/templates/task-card.md` and save it under `.agent-local/task-cards/`.
3. If scope is ambiguous, ask concise questions before implementation. Prefer safe defaults only when the risk is low and state them explicitly.
4. Choose the target location before editing:
   - OOP-only product code → `apps/oop`.
   - domain types/pure shared logic → `packages/core`.
   - axios API functions → `packages/api-client`.
   - reusable team-project templates/blocks → `packages/team-project-kit`.
   - domain-neutral UI primitives → `packages/ui`.
5. Implement only the requested scope.
6. Write a worklog under `.agent-local/worklogs/` that records changed files, convention decisions, verification evidence, and unresolved risks.
7. Run or delegate to `kd-test` for verification.
8. If the user asked for PR support, run or delegate to `kd-pr`.
9. Leave reusable team-rule candidates as `.agent-local/proposals/` only; do not edit `.agent/rules/` automatically.

## Outputs

- `.agent-local/task-cards/<task>.md`
- `.agent-local/worklogs/<task>.md`
- optional `.agent-local/proposals/<topic>.md`

## Must not

- Treat this as a human command sequence. The user-facing trigger is natural language; helper scripts are internal.
- Commit `.agent-local/`.
- Create `apps/database` or another course app without an explicit ticket.
- Move app code to shared packages just because it looks reusable once.
- Call work done without real verification output or an explicit blocker.
