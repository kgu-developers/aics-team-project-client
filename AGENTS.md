# AICS Team Project Client Agent Harness

This repository uses `.agent/` as a repo-local skill pack for coding agents such as OpenAI Codex and Claude Code.

The primary UX is **natural language**. Do not ask teammates to memorize or run harness commands. When a request matches one of the trigger phrases below, load the matching skill and use `.agent/scripts/` only as internal deterministic helpers.

## Natural-language skill routing

- 구현해줘 / 수정해줘 / 작업해줘 / 만들어줘 / 정리해줘 → read `.agent/skills/kd-work/SKILL.md`
- 테스트해줘 / 검증해줘 / 화면 확인해줘 / 스크린샷 후보 뽑아줘 → read `.agent/skills/kd-test/SKILL.md`
- PR 만들어줘 / PR 초안 써줘 / PR 설명 정리해줘 → read `.agent/skills/kd-pr/SKILL.md`
- 리뷰 반영해줘 / 코멘트 반영해줘 / 리뷰 답변 써줘 → read `.agent/skills/kd-review-fix/SKILL.md`
- 팀 컨벤션으로 남길 것 정리해줘 / 배운 점 정리해줘 / 규칙 후보 뽑아줘 → read `.agent/skills/kd-team-learning/SKILL.md`

## Product boundary

- This is a course team-project operation tool, not an LMS replacement.
- Primary flow: Course → Section → Team → Project → Milestone → Submission → Review.
- OOP is the first concrete app. Do not create another course app until an actual ticket requests it.
- `section` / 분반 is a first-class domain, not an optional filter.

## Operating contract

1. Treat `.agent/skills` as executable working guidance, not human-only documentation.
2. Read relevant files in `.agent/rules/` before changing code. For ordinary product work, start from `apps/oop` unless the request clearly names shared packages or repo tooling.
3. Use `.agent/scripts/` as deterministic helper tools when useful, but keep them behind the agent workflow. The user-facing interface remains natural language.
4. Keep all temporary cards, prompts, worklogs, PR drafts, screenshots, coaching notes, and team-learning proposals under `.agent-local/`.
5. Never commit `.agent-local/` or personal coaching notes.
6. Do not create another course app, push, open PRs, merge, or promote team rules unless the user explicitly asks.

## Work convention

- Notion tickets are the source of truth for sprint/ticket planning.
- Branches use `<type>/ATP-<number>`, e.g. `chore/ATP-1`.
- PR titles use `[ATP-<number>] 작업명`.
- Keep GitHub Issues optional; do not make them the main workflow by default.

## Verification

Run before handoff when feasible:

```bash
pnpm lint
pnpm build
```

Use app/package-scoped commands only when the change is clearly isolated and then state why repo-wide checks were skipped.
