---
name: kd-test
description: Trigger on natural-language KD/AICS verification requests such as 테스트해줘, 검증해줘, 화면 확인해줘, 스크린샷 후보 뽑아줘, 이 브랜치 점검해줘.
---

# KD/AICS Test Skill

## Teaching role

Verification is a learning artifact. Report not only pass/fail but also why those checks are the right checks for the changed scope.

## Natural-language triggers

Use this skill when the user asks to test, verify, inspect screen states, prepare screenshot evidence, or check a branch. Examples:

- “이 브랜치 테스트해줘”
- “검증하고 PR에 넣을 스크린샷 후보 뽑아줘”
- “화면 깨지는지 확인해줘”

## Steps

1. Inspect current diff with `git status --short`, `git diff --stat`, and, when relevant, the actual diff.
2. Run `.agent/scripts/check-local-files.mjs` to ensure `.agent-local` and private artifacts are ignored.
3. Run `.agent/scripts/check-diff-hygiene.mjs` to flag suspicious files.
4. Run `.agent/scripts/suggest-verification.mjs` to choose build/lint/test and app/package-specific checks.
5. Execute the necessary verification commands when the environment is ready. Default handoff checks are `pnpm lint` and `pnpm build`.
6. For UI changes, create a route/viewport/screenshot checklist using `.agent/scripts/make-screenshot-plan.mjs`.
7. If browser automation is available, capture route/viewport evidence; otherwise mark manual screenshot requirements clearly.
8. Separate passed checks, failed checks, skipped checks, and unverified risks.
9. Save evidence notes under `.agent-local/worklogs/` or `.agent-local/screenshots/` when useful.

## Evidence rule

Verification must be based on real command/browser output. Do not replace failed or unavailable checks with plausible text.

## PR screenshot standard

A PR should help reviewers understand the screen without cloning the branch. Include screenshot candidates for desktop/mobile and meaningful empty/error/success states when relevant.
