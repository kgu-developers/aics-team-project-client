---
name: kd-team-learning
description: Trigger on natural-language KD/AICS convention-learning requests such as 팀 컨벤션으로 남길 것 정리해줘, 배운 점 정리해줘, 규칙 후보 뽑아줘.
---

# KD/AICS Team Learning Skill

## Purpose

The harness should help new teammates learn. Shared rules should grow from repeated evidence, but personal coaching notes and one-off mistakes must stay local.

## Natural-language triggers

Use this skill when the user asks what should become team convention, or when repeated review/work ambiguity suggests a reusable rule. Examples:

- “팀 컨벤션으로 남길 것 정리해줘”
- “이번 작업에서 배운 점 뽑아줘”
- “다음 사람을 위한 규칙 후보 만들어줘”

## Promotion flow

```text
local observation
→ team-learning proposal under .agent-local/proposals/
→ human/team approval
→ update .agent/rules/ or Notion by explicit request
```

## Steps

1. Separate one-off bugs from reusable team rules.
2. Avoid teammate evaluation or private coaching data.
3. Cite the work situation, review comment, verification result, or screenshot evidence that motivated the rule.
4. Write a proposal using `.agent/templates/team-learning-proposal.md`.
5. Do not modify shared rules automatically.

## Good candidates

- Repeated file placement confusion.
- Ambiguous API state/copy decisions.
- Commonly missed verification or screenshot evidence.
- Review comments likely to recur.
- Prompt patterns that reliably improve KD/AICS work quality.
