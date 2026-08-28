# AICS Team Project Client

KD/AICS 강의의 팀 프로젝트 운영을 돕는 클라이언트입니다. 첫 앱은 OOP 강의용
`apps/oop`입니다. 다른 강의 앱은 실제 요구가 생길 때 `apps/{course}` 아래에
추가합니다.

## 서비스 범위

이 저장소는 LMS를 대체하지 않습니다. 강의 안에서 팀 프로젝트를 운영하는 데 필요한
흐름만 다룹니다.

```text
Course → Section → Team → Project → Milestone → Submission → Review
```

## 저장소 구조

```text
apps/
  oop/
packages/
  core/
  api-client/
  design-system/
configs/
  typescript/
.agent/
```

## 시작하기

```bash
pnpm install
pnpm dev
```

## 검증

```bash
pnpm lint
pnpm build
```

## OOP 배포

OOP 프론트엔드는 Cloudflare Workers Static Assets에 배포합니다. 운영 빌드는
`apps/oop/.env.production`에 설정한 `VITE_API_BASE_URL`을 사용합니다.

```bash
pnpm --filter @aics/oop deploy:dry-run
pnpm --filter @aics/oop deploy
```

배포 계정은 KGU 팀 프로젝트 Cloudflare 계정
`a6b2c7849807daa1d50fd035cb3e3e15`로 고정했습니다. 개인 계정으로 실행하면 권한
오류가 나며 배포되지 않습니다.

Cloudflare Workers Builds의 Git 연동은 저장소 루트를 기준으로 아래와 같이
설정합니다.

- 빌드 명령: `pnpm --filter @aics/oop build`
- 배포 명령: `pnpm --filter @aics/oop exec wrangler deploy`
- 환경 변수: `VITE_API_BASE_URL=https://team-project-api.kgudevelopers.monster`

`apps/oop/wrangler.jsonc`의 SPA fallback 설정에 따라 TanStack Router 경로로 직접
접속해도 `index.html`을 반환합니다.

## 작업 규칙

- 작업 계획은 Notion 티켓을 기준으로 합니다.
- 브랜치 이름은 `<type>/KD3-<number>` 형식입니다. 예: `chore/KD3-129`
- PR 제목은 `[KD3-<number>] 작업명` 형식입니다.
