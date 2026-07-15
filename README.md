# AICS Team Project Client

KD/AICS 강의 팀 프로젝트 운영 도구 클라이언트입니다. 1차 앱은 OOP 강의용 `apps/oop`이며, 이후 다른 강의 앱이 실제로 필요해질 때 `apps/{course}` 단위로 확장합니다.

## Product boundary

이 레포는 LMS 대체 프로젝트가 아닙니다. 강의 안에서 팀 프로젝트를 운영하는 흐름을 돕는 것이 목적입니다.

```text
Course → Section → Team → Project → Milestone → Submission → Review
```

## Repository shape

```text
apps/
  oop/
packages/
  ui/
  core/
  api-client/
  team-project-kit/
configs/
  typescript/
.agent/
```

## Getting started

```bash
pnpm install
pnpm dev
```

## Verification

```bash
pnpm lint
pnpm build
```

## Workflow

- Notion ticket is the planning source of truth.
- Branch convention: `<type>/ATP-<number>` such as `chore/ATP-1`.
- PR title convention: `[ATP-<number>] 작업명`.
