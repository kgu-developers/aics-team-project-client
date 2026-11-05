# OOP 환경변수

로컬 개발은 운영과 같은 화면·기능 경로로 실제 API를 호출한다. `pnpm dev` 자체는
Vite 개발 서버이며 운영 빌드를 실행하는 것은 아니다. 브라우저 MSW 모드는 제거했고,
MSW는 자동 테스트 안에서 HTTP 응답을 대체하는 도구로만 사용한다.

## 기본값

개발 기본값은 `apps/oop/.env.development`에 공유한다.

```dotenv
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://localhost:8080
VITE_OPEN_CHAT_URL=https://open.kakao.com/o/s38nlZNi
```

브라우저의 `/api/v1/...` 요청은 로컬 Vite를 거쳐 지정한 API로 전달된다.
기본 대상은 로컬 백엔드다. 백엔드가 실행 중이지 않으면 요청은 실패하며, 운영 API에
자동 접속하지 않는다. 공유/원격 서버에 접속할 때만 `.env.development.local`에
`VITE_API_PROXY_TARGET`을 명시하고, 대상 서버와 테스트 계정을 확인한다.
`VITE_API_BASE_URL=`의 빈 값은 의도된 설정이다. 값을 생략하면 API 클라이언트가
기본값 `http://localhost:8080`을 사용하므로 빈 값과 생략은 다르다.

운영 파일 `apps/oop/.env.production`은 다음 두 공개 설정을 유지한다.

```dotenv
VITE_API_BASE_URL=https://team-project-api.kgudevelopers.monster
VITE_OPEN_CHAT_URL=https://open.kakao.com/o/s38nlZNi
```

운영 정적 파일은 백엔드를 직접 호출한다. Vite 개발 프록시는 운영 빌드나 preview에
자동 적용되지 않는다. 로컬·운영의 실제 쿠키/CSRF/CORS 동작은 각각 확인한다.

## 개인 설정과 우선순위

- 앱 env 파일은 `apps/oop/`에 둔다. `.env.example`은 자동 로드되지 않는다.
- 개인 개발 설정은 `.env.development.local`에 둔다. 기본 로컬 백엔드 주소와
  다른 서버가 필요할 때만 `VITE_API_PROXY_TARGET`을 재지정한다.
- `.env.local`은 모든 모드에서 읽히므로 개발 전용 값은 `.env.development.local`로 옮긴다.
- 기존 `VITE_ENABLE_MSW`, `VITE_APP_ENV`는 개인 파일과 셸에서도 정리한다. 이제 사용하는 항목이 아니다.
- 개인 파일을 복사할 때 공유 운영 파일을 덮어쓰지 않는다.

우선순위는 높은 순서대로 프로세스 환경변수 → `.env.[mode].local` →
`.env.[mode]` → `.env.local` → `.env`이다. 개발 서버 변경은 재시작, 정적 파일 변경은
재빌드가 필요하다. 일반 규칙은 [Vite 문서](https://vite.dev/guide/env-and-mode)를 따른다.

| 항목                    | 역할                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`     | API 클라이언트 주소. 로컬 프록시는 빈 값, 운영은 실제 API origin                         |
| `VITE_API_PROXY_TARGET` | 개발 전용 프록시 대상. 경로 없는 HTTPS origin 또는 HTTP loopback                         |
| `VITE_OPEN_CHAT_URL`    | 공개 문의 링크. 앱에서는 빈 값으로 비활성화할 수 있지만 정식 배포 점검은 HTTPS 값을 요구 |

`VITE_` 값은 브라우저에 공개될 수 있다. 비밀번호·API 키·인증 토큰은 넣지 않는다.
프록시 대상에는 `/api/v1`, Swagger 경로, 계정 정보나 쿼리를 붙이지 않는다.

## 테스트 설정

- `pnpm test`는 자동 테스트 전체, OOP `test:logic`은 `.test.ts` 로직/HTTP 테스트,
  `test:ui`는 `.test.tsx` 화면/Hook 테스트를 실행한다.
- 기본 로직 환경은 Node다. `.test.ts` 중 실제 DOM/브라우저 상태가 필요한 파일은
  `@vitest-environment jsdom`으로 명시한다. DOM 설정은 그 환경에서만 로드한다.
- MSW 응답은 테스트별 `setupServer`와 핸들러로 제공한다. 개발 env로 켜고 끄지 않는다.
- Vitest는 API 주소를 `http://localhost:8080`으로 고정하고 개발 프록시를 끈다.
  개인 env의 실서버 주소를 상속하지 않으며, HTTP 테스트는 처리하지 않은 요청을 오류로 막는다.
- `test:e2e:contract`는 Playwright 요청 모킹이다. 브라우저 워커 없이 공통 UI와
  두 탭의 Web Locks 세션 복구를 검사한다.
- `test:e2e`/`test:e2e:live`/`test:e2e:integrated`는 실제 서버를 사용한다.
  실서버 검수에는 테스트 계정과 분반·팀·마일스톤 데이터가 필요하다.

실서버 E2E의 비밀번호와 접속 정보는 저장소 루트 `.agent-local/e2e/live.env` 또는
`integrated.env`에 둔다. `OOP_E2E_API_URL`은 테스트가 로컬 Vite를 띄울 때의 백엔드,
`OOP_E2E_BASE_URL`은 이미 실행 중인 프런트엔드 주소다. 계정 정보는 `OOP_E2E_`
변수를 사용하며 `VITE_`로 옮기지 않는다. 상세 조건은 [E2E 안내](../e2e/README.md)를 따른다.

## 전환 후 확인

1. 로컬 백엔드를 실행하거나 개인 개발 설정에 승인된 API 대상을 지정한 뒤
   `pnpm dev`로 `http://localhost:5173`에서 테스트 계정으로 로그인한다.
2. 요청이 로컬 origin으로 나가고 프록시 대상 서버에서 처리되는지 확인한다.
3. 오래된 MSW 워커는 앱 시작 시 정리한다. 이전 워커가 남아 보이면 해당 워커를
   확인하고 다시 접속한다. 실제 서버 데이터나 전체 브라우저 저장소를 지울 필요는 없다.
4. 운영 배포 전 개발용 셸 변수·`.env.production.local` override를 정리한다.
   현재 배포 점검이 허용하는 운영 변수는 API 주소와 문의 링크 두 개다.

현재 백엔드가 제공하지 않는 프로필 전용/전체 일정 API 등은 MSW의 테스트 응답으로
실서버 지원을 보장할 수 없다. 계약 보완 전에는 해당 화면의 실제 서버 검수가 별도로 필요하다.
