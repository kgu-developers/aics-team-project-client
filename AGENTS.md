# AICS Team Project Client Agent Harness

This repository uses `.agent/` as a repo-local skill pack for coding agents such as OpenAI Codex and Claude Code.

The primary UX is **natural language**. Do not ask teammates to memorize or run harness commands. Route the most specific matching phrase first, load that skill, and use `.agent/scripts/` only as internal deterministic helpers.

## Natural-language skill routing

- 구현해줘 / 수정해줘 / 작업해줘 / 만들어줘 / 정리해줘 → read `.agent/skills/kd-work/SKILL.md`
- 테스트해줘 / 검증해줘 / 화면 확인해줘 / 스크린샷 후보 뽑아줘 → read `.agent/skills/kd-test/SKILL.md`
- PR 만들어줘 / PR 초안 써줘 / PR 설명 정리해줘 → read `.agent/skills/kd-pr/SKILL.md`
- 리뷰 반영해줘 / 코멘트 반영해줘 / 리뷰 답변 써줘 → read `.agent/skills/kd-review-fix/SKILL.md`
- 팀 컨벤션으로 남길 것 정리해줘 / 배운 점 정리해줘 / 규칙 후보 뽑아줘 → read `.agent/skills/kd-team-learning/SKILL.md`
- 페이지/라우트/폴더 구조/파일 위치/어디에 둘지 판단 → read `.agent/rules/product-structure.md`
- 디자인 시스템/Astryx/컴포넌트/테마/UI 작업 → read `.agent/rules/design-system.md` and `.agent/rules/astryx-inventory.md`
- 로그인/세션/역할/접근 제어/라우트 가드 작업 → read `.agent/rules/routing-auth.md`
- API/React Query/MSW/mock 작업 → read `.agent/rules/api-msw.md` and `.agent/rules/testing.md`
- 테스트 코드 작성 → read `.agent/rules/testing.md`; 검증/화면 확인 → read `.agent/rules/verification.md`
- 최신 PRD 확인/요구사항 대조 → read `.agent/rules/workflow.md`의 private PRD source 절

## Product boundary

- This is a course team-project operation tool, not an LMS replacement.
- Primary flow: Course → Section → Team → Project → Milestone → Submission → Review.
- OOP is the first concrete app. Do not create another course app until an actual ticket requests it.
- `section` / 분반 is a first-class domain, not an optional filter.

## Operating contract

1. Treat `.agent/skills` as executable working guidance, not human-only documentation.
2. Read only the relevant source-of-truth files in `.agent/rules/` before changing code. For ordinary product work, start from `apps/oop` unless the request clearly names shared packages or repo tooling.
   - Read `packages/design-system/AGENTS.md` before editing that package.
3. Use `.agent/scripts/` as deterministic helper tools when useful, but keep them behind the agent workflow. The user-facing interface remains natural language.
4. Keep all temporary cards, prompts, worklogs, PR drafts, screenshots, coaching notes, private-source pointers/caches, and team-learning proposals under `.agent-local/`.
5. Never commit `.agent-local/` or personal coaching notes.
6. Do not create another course app, push, open PRs, merge, or promote team rules unless the user explicitly asks.

## Work convention

- Notion tickets are the source of truth for sprint/ticket planning.
- Use the ticket ID assigned to the work. The current OOP milestone/editor sprint uses `KD3-<number>`.
- Branches use `<type>/<ticket-id>`, for example `feature/KD3-89`.
- Commits use `<type>(<scope>): <ticket-id> <summary>`, for example `feat(editor): KD3-89 공통 에디터 조회 기반 추가`.
- PR titles use `[<ticket-id>] <summary>`, for example `[KD3-89] 공통 문서 에디터 기반`.
- Do not invent alphabetic sub-ticket IDs such as `KD3-89A`. Split work by the next assigned numeric ticket ID instead.
- Keep GitHub Issues optional; do not make them the main workflow by default.

## Verification

Run before handoff when feasible:

```bash
pnpm lint
pnpm build
```

Use app/package-scoped commands only when the change is clearly isolated and then state why repo-wide checks were skipped.
