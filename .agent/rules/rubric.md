# Harness Rubric

Define what “good” means before accepting an AI artifact.

## Task card

- Raw request preserved.
- User-facing goal is clear.
- Scope and non-goals are separated.
- Completion criteria are verifiable.
- Target files/packages are justified by repo rules.
- User confirmation questions are explicit when needed.

## Teaching / coaching

- File placement is explained briefly enough for a new teammate to learn.
- Convention choices are tied to a concrete rule, not “because AI said so.”
- One-off task details do not become shared rules automatically.
- Personal coaching notes stay in `.agent-local/`.

## Verification

- Commands are executable, not natural-language placeholders.
- Passed/failed/skipped checks are separated.
- UI changes include screenshot candidates.
- Unverified risks are visible.

## PR draft

- Summary is reviewer-friendly.
- Verification cites real evidence or blockers.
- Screenshot section is present for UI changes.
- Review focus points are specific.
- Author rewrite section remains for human ownership.

## Team-learning proposal

- Reusable beyond one task.
- Based on work evidence or review feedback.
- No private or teammate-evaluative content.
- Stays as proposal until approved.
