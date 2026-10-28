import type { AuthRefreshResponse } from '@aics/core';
import { CanceledError, isAxiosError } from 'axios';

import { retryAfterCsrfRotation } from './retryAfterCsrfRotation';
import { ENDPOINTS } from '../constants/endpoints';
import { authTransport } from '../transport';

// Only coordination metadata is shared. Tokens remain in HttpOnly cookies.
export const SESSION_RECOVERY_STORAGE_KEY = 'aics:session-recovery';
const LOCK_NAME = 'aics:cookie-session';
export type SessionGeneration = {
  session: string;
  revision: string;
};
type SharedFailure = SessionGeneration & {
  reason: 'expired' | 'unavailable';
};
type SharedSession = SessionGeneration & {
  response?: AuthRefreshResponse;
  failed?: SharedFailure;
};
export type SessionSnapshot = SharedSession & { epoch: number };
export type CookieSessionCommit<T> = {
  response: T;
  generation: SessionGeneration;
};
type SessionExpiryListener = (generation: SessionGeneration) => void;
const sessionExpiryListeners = new Set<SessionExpiryListener>();
let shared: SharedSession = { session: '', revision: '' };
let epoch = 0;
let active = false;
let changing = 0;
let pending: { key: string; promise: Promise<AuthRefreshResponse> } | undefined;
let queue: Promise<unknown> = Promise.resolve();

export class SessionRefreshError extends Error {
  constructor(public readonly expired: boolean) {
    super(
      expired
        ? '로그인 세션이 만료되었습니다.'
        : '세션 갱신을 확인하지 못했습니다. 새로고침 후 다시 로그인해 주세요.',
    );
    this.name = 'SessionRefreshError';
  }
}

function readShared(): SharedSession {
  try {
    const value = JSON.parse(
      localStorage.getItem(SESSION_RECOVERY_STORAGE_KEY) ?? 'null',
    );
    if (
      typeof value?.session === 'string' &&
      typeof value?.revision === 'string'
    ) {
      shared = value;
    } else {
      shared = { session: '', revision: '' };
    }
  } catch {
    // Without storage, Web Locks still serializes cookie writes across tabs.
  }
  return shared;
}

function writeShared(value: SharedSession) {
  shared = value;
  try {
    localStorage.setItem(SESSION_RECOVERY_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Same-tab coordination remains available when storage is disabled.
  }
}

function getOwnedFailure(value: SharedSession) {
  const failure = value.failed;
  return failure?.session === value.session &&
    failure.revision === value.revision
    ? failure
    : undefined;
}

export function isSessionGenerationCurrent(generation: SessionGeneration) {
  const current = readShared();
  return (
    current.session === generation.session &&
    current.revision === generation.revision
  );
}

export function onApiSessionExpired(listener: SessionExpiryListener) {
  sessionExpiryListeners.add(listener);
  return () => {
    sessionExpiryListeners.delete(listener);
  };
}

export function notifyApiSessionExpired(generation: SessionGeneration) {
  if (!isSessionGenerationCurrent(generation)) return;
  sessionExpiryListeners.forEach(listener => listener(generation));
}

export function observeSessionRecoveryStorage(value: string | null) {
  try {
    const observed = JSON.parse(value ?? 'null') as SharedSession | null;
    if (
      typeof observed?.session !== 'string' ||
      typeof observed.revision !== 'string'
    ) {
      return;
    }
    const failure = getOwnedFailure(observed);
    if (failure?.reason === 'expired') {
      notifyApiSessionExpired(failure);
    }
  } catch {
    // Ignore malformed coordination metadata from unrelated or older code.
  }
}

function throwOwnedFailure(failure: SharedFailure): never {
  if (failure.reason === 'expired') notifyApiSessionExpired(failure);
  throw new SessionRefreshError(failure.reason === 'expired');
}

export function getSessionSnapshot(): SessionSnapshot {
  return { ...readShared(), epoch };
}

export function assertSessionCurrent(snapshot: SessionSnapshot) {
  if (
    changing ||
    snapshot.epoch !== epoch ||
    snapshot.session !== readShared().session
  ) {
    throw new CanceledError('인증 상태가 변경되어 이전 요청을 취소했습니다.');
  }
}

/**
 * Revalidate an auth finalization against a definitive expiry owned by the
 * exact generation that started it. A marker from an older revision must not
 * block a newer, server-confirmed session.
 */
export function assertSessionFinalizationCurrent(snapshot: SessionSnapshot) {
  assertSessionCurrent(snapshot);
  const failure = getOwnedFailure(readShared());
  if (
    failure?.reason === 'expired' &&
    failure.session === snapshot.session &&
    failure.revision === snapshot.revision
  ) {
    throwOwnedFailure(failure);
  }
}

export function setApiSessionActive(value: boolean) {
  active = value;
  if (!value) {
    epoch += 1;
  }
}

export function isSessionRecoveryEnabled() {
  return active && changing === 0;
}

function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return await navigator.locks.request(LOCK_NAME, operation);
    }
    // Older browsers retain same-tab serialization only.
    return operation();
  });
  queue = next.catch(() => undefined);
  return next;
}

type SessionAbortSignal = {
  aborted: boolean;
  addEventListener?: (
    type: string,
    listener: () => void,
    options?: { once?: boolean },
  ) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
};

function throwIfAborted(signal?: SessionAbortSignal) {
  if (signal?.aborted) throw new CanceledError();
}

/**
 * Hold authenticated dispatch behind an in-flight refresh or cookie-session
 * change. The network request itself is not made while the lock is held.
 */
export async function waitForSessionRecovery(
  snapshot: SessionSnapshot,
  signal?: SessionAbortSignal,
) {
  throwIfAborted(signal);
  const wait = withSessionLock(async () => {
    throwIfAborted(signal);
    assertSessionCurrent(snapshot);
    const failure = getOwnedFailure(readShared());
    if (failure) throwOwnedFailure(failure);
  });
  if (!signal?.addEventListener || !signal.removeEventListener) {
    await wait;
    throwIfAborted(signal);
    return;
  }

  let cancel!: () => void;
  const canceled = new Promise<never>((_, reject) => {
    cancel = () => reject(new CanceledError());
    signal.addEventListener?.('abort', cancel, { once: true });
  });
  try {
    await Promise.race([wait, canceled]);
  } finally {
    signal.removeEventListener?.('abort', cancel);
  }
}

async function commitCookieSession<T>(
  operation: () => Promise<T>,
): Promise<CookieSessionCommit<T>> {
  epoch += 1;
  changing += 1;
  const operationEpoch = epoch;
  try {
    return await withSessionLock(async () => {
      if (operationEpoch !== epoch) throw new CanceledError();
      const response = await operation();
      if (operationEpoch !== epoch) throw new CanceledError();
      // Publish only a server-confirmed cookie-session change. Starting a
      // login/logout still invalidates this tab's stale work through `epoch`,
      // but a definitive failure must not evict authenticated sibling tabs.
      const generation = { session: crypto.randomUUID(), revision: '' };
      writeShared(generation);
      return { generation, response };
    });
  } catch (error) {
    if (operationEpoch !== epoch) throw new CanceledError();
    throw error;
  } finally {
    changing -= 1;
  }
}

/** Serialize login/logout with refresh so late Set-Cookie cannot undo logout. */
export async function changeCookieSession<T>(operation: () => Promise<T>) {
  return (await commitCookieSession(operation)).response;
}

/** Return the exact generation published by a confirmed cookie-session commit. */
export function changeCookieSessionWithCommit<T>(operation: () => Promise<T>) {
  return commitCookieSession(operation);
}

/** One refresh per request generation, including delayed 401 responses. */
export function recoverSession(snapshot = getSessionSnapshot()) {
  assertSessionCurrent(snapshot);
  if (changing) throw new CanceledError();
  const key = `${snapshot.epoch}:${snapshot.session}`;
  if (pending?.key === key) return pending.promise;
  const promise = withSessionLock(async () => {
    assertSessionCurrent(snapshot);
    const current = readShared();
    // A failed rotation may have reached the server. Only a new login/logout
    // clears this marker; retries and other tabs must not replay that token.
    const failure = getOwnedFailure(current);
    if (failure) {
      if (!active) {
        throw new SessionRefreshError(failure.reason === 'expired');
      }
      throwOwnedFailure(failure);
    }
    if (current.revision !== snapshot.revision && current.response) {
      return current.response;
    }
    try {
      const response = await retryAfterCsrfRotation(async () => {
        const result = await authTransport.post<AuthRefreshResponse>(
          ENDPOINTS.AUTH.REFRESH,
          undefined,
          { timeout: 15_000 },
        );
        return result.data;
      });
      assertSessionCurrent(snapshot);
      writeShared({
        session: current.session,
        revision: crypto.randomUUID(),
        // Never persist an unfiltered server body (it may gain token fields).
        response: { message: 'Session refreshed', role: response.role },
      });
      return response;
    } catch (error) {
      assertSessionCurrent(snapshot);
      const expired = isAxiosError(error) && error.response?.status === 401;
      writeShared({
        ...current,
        failed: {
          reason: expired ? 'expired' : 'unavailable',
          session: current.session,
          revision: current.revision,
        },
      });
      throw new SessionRefreshError(expired);
    }
  });
  const entry = { key, promise };
  pending = entry;
  // Avoid an unhandled rejected promise from a detached finally().
  void promise.then(
    () => {
      if (pending === entry) pending = undefined;
    },
    () => {
      if (pending === entry) pending = undefined;
    },
  );
  return promise;
}
