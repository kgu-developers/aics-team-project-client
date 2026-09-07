import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { liveEditLockTargetTypes, type LiveEditLockStatus } from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import { getDemoUserAccount } from '../data/users';

export type LiveEditLockMockSubmission = {
  id: number;
  studentNumbers: readonly string[];
};
export const liveEditLockMockSubmissions: readonly LiveEditLockMockSubmission[] =
  [{ id: 19, studentNumbers: ['20260001', '20260003'] }];

/** Isolated real-contract handlers; deliberately not installed over legacy leases. */
export function createLiveEditLockHandlers({
  submissions = liveEditLockMockSubmissions,
  now = Date.now,
}: {
  submissions?: readonly LiveEditLockMockSubmission[];
  now?: () => number;
} = {}) {
  const locks = new Map<string, { lockedBy: string; at: number }>();
  function status(key: string): LiveEditLockStatus {
    const lock = locks.get(key);
    if (!lock || now() - lock.at > 120_000)
      return { locked: false, lockedBy: null, lockedAt: null };
    return {
      locked: true,
      lockedBy: lock.lockedBy,
      lockedAt: new Date(lock.at).toISOString().slice(0, 16).replace('T', ' '),
    };
  }
  const error = (code: string, status: number) =>
    HttpResponse.json({ code }, { status });
  return ['get', 'post', 'delete'].map(method =>
    http[method as 'get' | 'post' | 'delete'](
      `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
      async ({ request }) => {
        const account = getDemoUserAccount(getMockAccessToken(request));
        if (!account) return error('UNAUTHORIZED', 401);
        let input: Record<string, unknown>;
        if (method === 'post') {
          try {
            input = (await request.json()) as Record<string, unknown>;
          } catch {
            return error('INVALID_TARGET', 400);
          }
          if (!input || typeof input !== 'object')
            return error('INVALID_TARGET', 400);
        } else {
          const params = new URL(request.url).searchParams;
          input = {
            targetType: params.get('targetType'),
            targetId: Number(params.get('targetId')),
          };
        }
        if (
          !liveEditLockTargetTypes.includes(
            input.targetType as 'PROJECT' | 'PRESENTATION_CONTENT',
          ) ||
          typeof input.targetId !== 'number' ||
          !Number.isSafeInteger(input.targetId) ||
          input.targetId <= 0
        )
          return error('INVALID_TARGET', 400);
        const key = `${input.targetType}:${input.targetId}`;
        const userId = account.user.studentNumber;
        if (method === 'delete') {
          if (locks.get(key)?.lockedBy === userId) locks.delete(key);
          return new HttpResponse(null, { status: 204 });
        }
        if (input.targetType === 'PROJECT')
          return error('EDIT_LOCK_UNSUPPORTED_TARGET', 501);
        const submission = submissions.find(item => item.id === input.targetId);
        if (!submission) return error('SUBMISSION_NOT_FOUND', 404);
        if (
          account.user.globalRole !== 'STUDENT' ||
          !submission.studentNumbers.includes(userId)
        )
          return error('ACCESS_DENIED', 403);
        if (method === 'post') {
          const existing = status(key);
          if (existing.locked && existing.lockedBy !== userId)
            return error('EDIT_LOCK_CONFLICT', 409);
          locks.set(key, { lockedBy: userId, at: now() });
        }
        return HttpResponse.json(status(key));
      },
    ),
  );
}
