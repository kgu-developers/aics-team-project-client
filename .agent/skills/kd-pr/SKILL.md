---
name: kd-pr
description: Trigger on natural-language KD/AICS PR requests such as PR 만들어줘, PR 초안 써줘, PR 설명 정리해줘.
---

# KD/AICS PR Skill

## Teaching role

Write PR drafts that teach reviewers what changed, why it belongs in the chosen files, and how it was verified.

## Steps

1. Inspect `git status --short`, `git diff --stat`, commits, and relevant worklogs under `.agent-local/worklogs/`.
2. Use `.agent/scripts/collect-pr-evidence.mjs` to summarize changed files and verification evidence.
3. Draft the PR body from `.agent/templates/pr-draft.md` under `.agent-local/pr-drafts/`.
4. Include the Notion ticket key (`ATP-<number>`), summary, tasks, verification, review focus, and screenshot section for UI changes.
5. Do not push or create the GitHub PR unless the user explicitly asks.

## PR naming

- Branch: `<type>/ATP-<number>`
- PR title: `[ATP-<number>] <summary>`
- Commit: `<type>(<scope>): ATP-<number> <summary>`
