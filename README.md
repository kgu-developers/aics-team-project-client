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

## 작업 규칙

- 작업 계획은 Notion 티켓을 기준으로 합니다.
- 브랜치 이름은 `<type>/KD3-<number>` 형식입니다. 예: `chore/KD3-129`
- PR 제목은 `[KD3-<number>] 작업명` 형식입니다.

### 개발 API 모드

기본 `pnpm dev`는 MSW 데모 모드입니다. 실서버 연결은 `apps/oop/.env.local`에
`VITE_ENABLE_MSW=false`, `VITE_API_BASE_URL=` (빈 값), `VITE_API_PROXY_TARGET=<개발 API origin>`을 지정하고 재시작합니다.
Vite는 개발 중에만 API 요청을 프록시합니다. 운영 빌드는 `.env.production`에
지정된 API 서버를 직접 호출합니다.
실서버 검증은 백엔드 CORS가 허용한 `http://localhost:5173`에서 진행합니다.
로그인/갱신 응답의 역할과 `/users/me`로 세션을 복원하며 토큰은 HttpOnly 쿠키로 관리합니다.
실서버 모드는 아직 전환되지 않은 화면 API까지 지원한다는 의미가 아닙니다.
운영 화면과 API의 호스트가 다르므로 백엔드와 CSRF 토큰 전달 계약을 확인해야 합니다.
운영 도메인의 로그인·갱신·로그아웃은 별도 검증이 필요합니다.
MSW의 기존 화면 fixture 문맥 보충은 `mocks/resolveDemoCurrentUser`에 한정되며 실서버 데이터에는 적용되지 않습니다.

`/users/me.globalRole`은 `ADMIN | USER`이고 로그인·갱신의 `role`은
`ADMIN | STUDENT | ASSISTANT`입니다. 정상 조교는 `USER + ASSISTANT`이므로
로그인 역할을 보존하되 두 응답의 조합이 모순되면 세션 복원을 거부합니다.
이 계약은 [서버 역할 계산](https://github.com/kgu-developers/aics-team-project-server/blob/09e1f30169327252e1e4880424ce6e714f3e6f40/aics-domain/src/main/java/kgu/developers/domain/user/application/query/UserQueryService.java#L35-L43),
[`/users/me` 구현](https://github.com/kgu-developers/aics-team-project-server/blob/09e1f30169327252e1e4880424ce6e714f3e6f40/aics-api/src/main/java/kgu/developers/api/user/presentation/UserControllerImpl.java#L21-L31),
[2026-09-05 성공 배포](https://github.com/kgu-developers/aics-team-project-server/actions/runs/33933839982)를 기준으로 합니다.
배포 이력은 현재 서버의 가용성이나 실제 계정 검증을 대신하지 않습니다.

MSW는 새 탭에서도 세션을 복원할 수 있도록 데모 계정 ID와 토큰 세대 번호만
localStorage에 공유합니다. 실제 인증 토큰은 저장하지 않습니다.
