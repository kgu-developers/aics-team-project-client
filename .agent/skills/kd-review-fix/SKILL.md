---
name: kd-review-fix
description: Trigger on natural-language KD/AICS review-fix requests such as 리뷰 반영해줘, 코멘트 반영해줘, 리뷰 답변 써줘.
---

# KD/AICS Review Fix Skill

## Steps

1. Capture the actual review comment, not only a summary.
2. Decide whether the comment is still valid against current code.
3. Write a review fix card under `.agent-local/review-fixes/` using `.agent/templates/review-fix-card.md`.
4. Apply only the review-fix scope.
5. Rerun the affected verification bundle.
6. Draft a short reviewer response with what changed and what was verified.
7. Do not silently promote review feedback into shared rules; create a team-learning proposal if it is reusable.
