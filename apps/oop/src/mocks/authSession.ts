import { demoUserAccounts, type DemoUserAccount } from './data/users';

export const mockAccessTokenCookieName = 'accessToken';
export const mockRefreshTokenCookieName = 'refreshToken';
export const mockCsrfCookieName = 'XSRF-TOKEN';
export const mockCsrfHeaderName = 'X-XSRF-TOKEN';
export const mockCsrfToken = 'msw-oop-csrf-token';

type MockSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

type MockSession = {
  account: DemoUserAccount;
  tokens: MockSessionTokens;
};

const sessionsByStudentNumber = new Map<string, MockSession>();
let rotation = 0;
const mockSessionStorageKey = 'aics:demo-session-generations';

function persistMockSessions() {
  if (typeof localStorage === 'undefined') return;
  // Store only fixture account IDs and generation numbers, never real tokens.
  const generations = [...sessionsByStudentNumber.values()].map(session => ({
    studentNumber: studentNumberOf(session.account),
    generation: Number(
      session.tokens.accessToken.match(/-rotated-(\d+)$/)?.[1] ?? 0,
    ),
  }));
  localStorage.setItem(mockSessionStorageKey, JSON.stringify(generations));
}

function restoreMockSessions() {
  if (typeof localStorage === 'undefined') return;
  try {
    // Cookies are shared across tabs, so their fixture generation must be too.
    // Migrate the previous tab-local fixture state once on an existing demo tab.
    const previous = sessionStorage.getItem(mockSessionStorageKey);
    if (localStorage.getItem(mockSessionStorageKey) === null && previous) {
      localStorage.setItem(mockSessionStorageKey, previous);
    }
    sessionStorage.removeItem(mockSessionStorageKey);
    const saved: unknown = JSON.parse(
      localStorage.getItem(mockSessionStorageKey) ?? 'null',
    );
    if (!Array.isArray(saved)) return;
    const restored: MockSession[] = [];
    for (const item of saved) {
      if (
        !item ||
        typeof item !== 'object' ||
        !Number.isSafeInteger(item.generation) ||
        item.generation < 0
      )
        return;
      const account = demoUserAccounts.find(
        account => studentNumberOf(account) === item.studentNumber,
      );
      if (!account) return;
      const suffix = item.generation ? `-rotated-${item.generation}` : '';
      restored.push({
        account,
        tokens: {
          accessToken: account.accessToken + suffix,
          refreshToken: account.refreshToken + suffix,
        },
      });
      rotation = Math.max(rotation, item.generation);
    }
    sessionsByStudentNumber.clear();
    restored.forEach(session =>
      sessionsByStudentNumber.set(studentNumberOf(session.account), session),
    );
  } catch {
    /* Invalid demo state starts a new fixture session. */
  }
}

function studentNumberOf(account: DemoUserAccount) {
  return account.credentials.studentNumber;
}

function baseSession(account: DemoUserAccount): MockSession {
  return {
    account,
    tokens: {
      accessToken: account.accessToken,
      refreshToken: account.refreshToken,
    },
  };
}

function cookieValue(request: Request, name: string) {
  const fromHeader = request.headers
    .get('cookie')
    ?.split(/[;,]/)
    .map(value => value.trim())
    .find(value => value.startsWith(`${name}=`))
    ?.slice(name.length + 1);
  if (fromHeader) return fromHeader;
  if (typeof document === 'undefined') return undefined;
  // Browser Headers hide Cookie. Dedicated demo cookies also avoid collisions
  // with real HttpOnly cookies from a localhost development proxy.
  const key = name === mockCsrfCookieName ? name : `aics-demo-${name}`;
  return document.cookie
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(`${key}=`))
    ?.slice(key.length + 1);
}

function appendCookie(headers: Headers, cookie: string) {
  headers.append('Set-Cookie', cookie);
}

function tokenCookie(name: string, value: string, maxAge: number) {
  // MSW runs on local HTTP during development, so Secure is intentionally
  // omitted. The deployed server adds it through jwt.cookie-secure.
  return `${name}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function csrfCookie() {
  // MSW stores Set-Cookie virtually; axios reads non-HttpOnly XSRF from document.cookie.
  if (typeof document !== 'undefined')
    document.cookie = `${mockCsrfCookieName}=${mockCsrfToken}; Path=/; SameSite=Lax`;
  return `${mockCsrfCookieName}=${mockCsrfToken}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function resetMockSessionState() {
  if (typeof document !== 'undefined') {
    document.cookie = 'aics-demo-accessToken=; Path=/; Max-Age=0';
    document.cookie = 'aics-demo-refreshToken=; Path=/; Max-Age=0';
  }
  sessionsByStudentNumber.clear();
  demoUserAccounts.forEach(account => {
    sessionsByStudentNumber.set(studentNumberOf(account), baseSession(account));
  });
  rotation = 0;
  if (typeof sessionStorage !== 'undefined')
    sessionStorage.removeItem(mockSessionStorageKey);
  persistMockSessions();
}

export function issueMockSession(account: DemoUserAccount) {
  restoreMockSessions();
  const session = baseSession(account);
  sessionsByStudentNumber.set(studentNumberOf(account), session);
  persistMockSessions();
  return session;
}

export function rotateMockSession(request: Request) {
  restoreMockSessions();
  const refreshToken = cookieValue(request, mockRefreshTokenCookieName);
  const current = [...sessionsByStudentNumber.values()].find(
    session => session.tokens.refreshToken === refreshToken,
  );

  if (!current) return undefined;

  rotation += 1;
  const next: MockSession = {
    account: current.account,
    tokens: {
      accessToken: `${current.account.accessToken}-rotated-${rotation}`,
      refreshToken: `${current.account.refreshToken}-rotated-${rotation}`,
    },
  };
  sessionsByStudentNumber.set(studentNumberOf(current.account), next);
  persistMockSessions();
  return next;
}

export function revokeMockSession(request: Request) {
  restoreMockSessions();
  const refreshToken = cookieValue(request, mockRefreshTokenCookieName);
  const current = [...sessionsByStudentNumber.entries()].find(
    ([, session]) => session.tokens.refreshToken === refreshToken,
  );

  if (current) sessionsByStudentNumber.delete(current[0]);
  persistMockSessions();
}

export function revokeMockAccountSession(account: DemoUserAccount) {
  restoreMockSessions();
  sessionsByStudentNumber.delete(studentNumberOf(account));
  persistMockSessions();
}

export function getMockAuthenticatedAccount(request: Request) {
  restoreMockSessions();
  const cookieAccessToken = cookieValue(request, mockAccessTokenCookieName);
  const authorization = request.headers.get('authorization');
  const bearerAccessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  const candidateTokens = [bearerAccessToken ?? cookieAccessToken].filter(
    (token): token is string => Boolean(token),
  );

  return [...sessionsByStudentNumber.values()].find(session =>
    candidateTokens.includes(session.tokens.accessToken),
  )?.account;
}

export function hasValidMockCsrfToken(request: Request) {
  const cookieToken = cookieValue(request, mockCsrfCookieName);
  const headerToken = request.headers.get(mockCsrfHeaderName);
  return Boolean(cookieToken && cookieToken === headerToken);
}

export function mockSessionResponseHeaders(session: MockSession) {
  // MSW 2.x joins Set-Cookie values in its virtual jar. Mirror only fixture
  // cookies on the demo origin; this does not simulate real HttpOnly protection.
  if (typeof document !== 'undefined') {
    document.cookie = `aics-demo-${mockAccessTokenCookieName}=${session.tokens.accessToken}; Path=/; SameSite=Lax`;
    document.cookie = `aics-demo-${mockRefreshTokenCookieName}=${session.tokens.refreshToken}; Path=/; SameSite=Lax`;
  }
  const headers = new Headers();
  appendCookie(
    headers,
    tokenCookie(mockAccessTokenCookieName, session.tokens.accessToken, 1800),
  );
  appendCookie(
    headers,
    tokenCookie(
      mockRefreshTokenCookieName,
      session.tokens.refreshToken,
      1209600,
    ),
  );
  appendCookie(headers, csrfCookie());
  return headers;
}

export function mockCsrfResponseHeaders() {
  const headers = new Headers();
  appendCookie(headers, csrfCookie());
  return headers;
}

export function expiredMockSessionResponseHeaders() {
  if (typeof document !== 'undefined') {
    document.cookie = `aics-demo-${mockAccessTokenCookieName}=; Path=/; Max-Age=0`;
    document.cookie = `aics-demo-${mockRefreshTokenCookieName}=; Path=/; Max-Age=0`;
  }
  const headers = new Headers();
  appendCookie(headers, tokenCookie(mockAccessTokenCookieName, '', 0));
  appendCookie(headers, tokenCookie(mockRefreshTokenCookieName, '', 0));
  appendCookie(headers, csrfCookie());
  return headers;
}

demoUserAccounts.forEach(account =>
  sessionsByStudentNumber.set(studentNumberOf(account), baseSession(account)),
);
restoreMockSessions();

/** Resolve rotating cookie sessions to the stable identity used by legacy fixtures. */
export function getMockAccessToken(request: Request): string | null {
  return getMockAuthenticatedAccount(request)?.accessToken ?? null;
}
