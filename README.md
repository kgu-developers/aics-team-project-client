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

Node.js 22 이상과 pnpm 10을 사용합니다.

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

OOP 프론트엔드는 Cloudflare Pages에 배포합니다. 운영 빌드는
`apps/oop/.env.production`에 설정한 `VITE_API_BASE_URL`을 사용합니다.

```bash
pnpm --filter @aics/oop run deploy
```

배포 계정은 KGU 팀 프로젝트 Cloudflare 계정
`a6b2c7849807daa1d50fd035cb3e3e15`만 사용합니다. 로컬에서는 Wrangler의
`kgu-oop` 프로필로 로그인해야 합니다.

Pages 프로젝트 이름은 `aics-oop`, 운영 브랜치는 `main`입니다. 커스텀 도메인은
`team-project.kgudevelopers.monster`를 사용하며, DNS 제공자에서 아래 CNAME을
등록합니다. Cloudflare Pages의 Custom domains에 도메인을 먼저 추가한 뒤 DNS를
설정해야 합니다.

```text
Type: CNAME
Name: team-project
Target: aics-oop.pages.dev
```

백엔드 CORS 허용 목록에는 아래 운영 Origin을 추가해야 합니다.

```text
https://team-project.kgudevelopers.monster
```

기존 Workers Static Assets 배포는 롤백용으로 유지합니다.

```bash
pnpm --filter @aics/oop run deploy:worker:dry-run
pnpm --filter @aics/oop run deploy:worker
```

Pages는 최상위 `404.html`이 없는 정적 앱을 SPA로 처리합니다. TanStack Router
경로에 직접 접속해도 `index.html`을 반환합니다. Workers 롤백 배포에서는
`apps/oop/wrangler.worker.jsonc`의 SPA fallback 설정을 사용합니다.

학생 공통 푸터의 `문의하기` 링크는 공개 빌드 설정 `VITE_OPEN_CHAT_URL`로
재정의할 수 있습니다. 설정이 없으면 확인된 카카오 오픈채팅 URL을 기본으로
사용하며, 빈 값 또는 잘못된 URL을 명시하면 비활성 텍스트만 표시합니다. 이 값은
브라우저에 공개되므로 비밀이나 자격 증명을 넣지 않습니다.

## 작업 규칙

- 작업 계획은 Notion 티켓을 기준으로 합니다.
- 브랜치 이름은 `<type>/KD3-<number>` 형식입니다. 예: `chore/KD3-129`
- PR 제목은 `[KD3-<number>] 작업명` 형식입니다.

### 로컬 개발과 환경변수

기본 `pnpm dev`는 `apps/oop/.env.development`를 읽어 로컬 백엔드
`http://localhost:8080`에 연결합니다. 공유/운영 API는 개인 설정에서 명시적으로
지정해야 합니다.
개발 전용 MSW 화면 모드는 없습니다. 개인 설정은 `.env.development.local`에서만
덮어쓰고, 이전 `VITE_ENABLE_MSW`·`VITE_APP_ENV` 값은 정리합니다.

[OOP 환경변수 안내](apps/oop/docs/environment.md)에 로컬·운영 값, 프록시,
적용 우선순위와 테스트 설정을 정리했습니다. 실서버 검수는 준비된 테스트 계정으로
`http://localhost:5173`에서 진행합니다. MSW는 자동 테스트의 API 응답 모킹에만 사용합니다.
