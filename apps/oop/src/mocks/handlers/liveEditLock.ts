import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import {
  isSupportedLiveEditLockTarget,
  type LiveEditLockStatus,
  type LiveEditLockTarget,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import {
  liveEditLockMockResources,
  type LiveEditLockMockResource,
} from '../data/liveEditLock';
import { getDemoUserAccount } from '../data/users';

/** Opt-in real-contract handlers; legacy editor leases remain a separate mock. */
export function createLiveEditLockHandlers({
  resources = liveEditLockMockResources,
  now = Date.now,
}: {
  resources?: readonly LiveEditLockMockResource[];
  now?: () => number;
} = {}) {
  const locks = new Map<
    string,
    { lockedBy: string; lockedByName: string; at: number }
  >();
  const keyOf = (target: LiveEditLockTarget) =>
    JSON.stringify([target.targetType, target.targetId, target.sectionKey]);
  function status(key: string): LiveEditLockStatus {
    const lock = locks.get(key);
    if (!lock || now() - lock.at > 120_000)
      return {
        locked: false,
        lockedBy: null,
        lockedByName: null,
        lockedAt: null,
      };
    return {
      locked: true,
      lockedBy: lock.lockedBy,
      lockedByName: lock.lockedByName,
      lockedAt: new Date(lock.at).toISOString().slice(0, 16).replace('T', ' '),
    };
  }
  const error = (code: string, status: number) =>
    HttpResponse.json({ code }, { status });
  return (['get', 'post', 'delete'] as const).map(method =>
    http[method](
      `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
      async ({ request }) => {
        const account = getDemoUserAccount(getMockAccessToken(request));
        if (!account) return error('UNAUTHORIZED', 401);
        let input: Record<string, unknown>;
        if (method === 'post') {
          try {
            input = (await request.json()) as Record<string, unknown>;
          } catch {
            return error('INVALID_INPUT', 400);
          }
          if (!input || typeof input !== 'object' || Array.isArray(input))
            return error('INVALID_INPUT', 400);
        } else {
          const params = new URL(request.url).searchParams;
          input = {
            targetType: params.get('targetType'),
            targetId: Number(params.get('targetId')),
            sectionKey: params.get('sectionKey'),
          };
        }
        if (!isSupportedLiveEditLockTarget(input))
          return error('INVALID_INPUT', 400);
        const key = keyOf(input);
        const userId = account.user.studentNumber;
        // The deployed DELETE checks the owning account, not membership or a lease.
        if (method === 'delete') {
          if (locks.get(key)?.lockedBy === userId) locks.delete(key);
          return new HttpResponse(null, { status: 204 });
        }
        const resource = resources.find(
          item =>
            item.targetType === input.targetType && item.id === input.targetId,
        );
        if (!resource)
          return error(
            input.targetType === 'PROJECT'
              ? 'PROJECT_NOT_FOUND'
              : input.targetType === 'MEETING_RECORD'
                ? 'MEETING_RECORD_NOT_FOUND'
                : 'MID_REPORT_NOT_FOUND',
            404,
          );
        if (
          !resource.studentNumbers.includes(userId) ||
          !account.user.sections.some(
            section =>
              section.id === resource.sectionId && section.role === 'STUDENT',
          )
        )
          return HttpResponse.json(
            {
              code: 'ACCESS_DENIED',
              message: '해당 분반의 팀원만 편집할 수 있습니다.',
            },
            { status: 403 },
          );
        if (method === 'post') {
          const existing = status(key);
          if (existing.locked && existing.lockedBy !== userId)
            return error('EDIT_LOCK_CONFLICT', 409);
          locks.set(key, {
            lockedBy: userId,
            lockedByName: account.user.name,
            at: now(),
          });
        }
        return HttpResponse.json(status(key));
      },
    ),
  );
}
