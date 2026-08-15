# Workflow and private local sources

## Git and tickets

- Notion is the sprint/ticket source of truth; GitHub is for code review and CI.
- Branch: `<type>/ATP-<number>`
- Commit: `<type>(<scope>): ATP-<number> <summary>`
- PR title: `[ATP-<number>] <summary>`
- Do not push, open a PR, merge, or promote team rules without explicit user approval.

## Local artifacts

Temporary or private agent artifacts belong only under `.agent-local/`, including task cards, worklogs, PR drafts, review fixes, screenshots, proposals, coaching notes, private-source pointers, and caches. Never commit `.agent-local/`.

Create artifacts in proportion to the work:

- Small, explicit change: task card and worklog are optional; report scope and verification in the handoff.
- Ambiguous, ticketed, multi-layer, or high-risk change: create a task card.
- Important decisions, unverified risks, or reusable handoff value: create a worklog.
- PR, review-fix, and team-learning workflows keep their dedicated artifacts.

## Private PRD source

The latest PRD may be referenced locally without exposing its URL or contents in Git.

```text
.agent-local/
  sources/prd-source.json
  prd-cache/latest.xlsx
  prd-cache/metadata.json
```

- Store the PRD URL/file ID only in `.agent-local/sources/prd-source.json`; never hardcode it in `.agent`, scripts, logs, or application code.
- Store downloaded PRD files only under `.agent-local/prd-cache/` and verify the directory is ignored before use.
- `metadata.json` may record fetch time, source modification time/version, and cache status; it must not repeat credentials or sensitive contents.
- Before requirement-sensitive work, check cache freshness. If missing or stale, refresh through an authenticated source when available.
- If refresh fails, label the cache stale; do not claim it is current.
- Do not print the URL, credentials, or full PRD contents in tool output, worklogs, PR drafts, or final responses.
- Read only the sheets/ranges needed for the task when the PRD contains personal or sensitive data.
- Treat the PRD as requirement source of truth, but do not automatically rewrite code or shared rules when it conflicts with them. Report the difference and obtain approval.
- Promote only approved, non-sensitive, durable product rules into `.agent/rules/`.
