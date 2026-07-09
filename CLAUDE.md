# AICS Agent Harness for Claude Code

Use `.agent/` as the shared KD/AICS skill pack. This file is a thin Claude Code entrypoint; keep the real workflow in `.agent/skills` and `.agent/rules`.

The default interaction model is **natural language**, not slash commands. If a teammate says “작업해줘”, “테스트해줘”, “PR 초안 써줘”, or similar, infer the right KD/AICS skill and run the workflow.

## Route natural-language requests

- 구현/수정/작업 요청: `.agent/skills/kd-work/SKILL.md`
- 테스트/검증/화면 확인/스크린샷 후보 요청: `.agent/skills/kd-test/SKILL.md`
- PR 초안/PR 설명 요청: `.agent/skills/kd-pr/SKILL.md`
- 리뷰 코멘트 반영/리뷰 답변 요청: `.agent/skills/kd-review-fix/SKILL.md`
- 팀 컨벤션/학습 후보 정리 요청: `.agent/skills/kd-team-learning/SKILL.md`

## Guardrails

- Store local outputs in `.agent-local/` only.
- For ordinary product work, inspect `apps/oop` first unless the request clearly says shared package/repo tooling.
- Use deterministic scripts in `.agent/scripts/` for diff hygiene, local-file checks, verification suggestions, screenshot plans, and PR evidence collection only as internal helpers.
- Ask for human approval before broad scope changes, GitHub PR creation, pushing, or team rule promotion.
