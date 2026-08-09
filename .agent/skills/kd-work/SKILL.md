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

## Context to preserve when relevant

- Raw user request.
- Current branch and `git status --short`.
- Relevant app/package boundary from `.agent/rules/product-structure.md`.
- Ticket key if present, e.g. `ATP-1`.

## Steps

1. Read `product-structure.md`, `code-quality.md`, and only the other rules relevant to the requested scope.
   - UI, component, theme, or Astryx work: read `design-system.md` and `astryx-inventory.md`; before editing the package, read `packages/design-system/AGENTS.md`.
   - Route, login, session, role, or access work: also read `routing-auth.md`.
   - API, Query, mock, fixture, or MSW work: read `api-msw.md`; for test code also read `testing.md`.
   - Requirement-sensitive work: read the private PRD section of `workflow.md` and check freshness without exposing the source.
2. Create a task card for ambiguous, ticketed, multi-layer, or high-risk work. It is optional for a small explicit change.
3. If scope is ambiguous, ask concise questions before implementation. Prefer safe defaults only when the risk is low and state them explicitly.
4. Choose the target location using `product-structure.md` before editing. Do not invent a future shared-package name.
5. Implement only the requested scope.
6. Write a worklog when the task has important decisions, unresolved risks, or reusable handoff value. Small explicit changes may report this in the final handoff.
7. Run or delegate to `kd-test` for verification.
8. If the user asked for PR support, run or delegate to `kd-pr`.
9. Leave reusable team-rule candidates as `.agent-local/proposals/` only; do not edit `.agent/rules/` automatically.

## Outputs

- optional `.agent-local/task-cards/<task>.md`
- optional `.agent-local/worklogs/<task>.md`
- optional `.agent-local/proposals/<topic>.md`

## Must not

- Treat this as a human command sequence. The user-facing trigger is natural language; helper scripts are internal.
- Commit `.agent-local/`.
- Create `apps/database` or another course app without an explicit ticket.
- Move app code to shared packages just because it looks reusable once.
- Call work done without real verification output or an explicit blocker.
