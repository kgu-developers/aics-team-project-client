import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import {
  editLockTargetTypes,
  type EditLockAcquireInput,
  type EditLockReleaseInput,
  type EditLockStatus,
  type EditLockTarget,
  type EditLockTargetType,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { requireStudent } from './studentGuard';

type StoredLease = EditLockStatus & {
  leaseId: string;
  locked: true;
  lockedAt: string;
  lockedBy: string;
};

type LockableDocument = {
  id: string;
  blocks: {
    key: string;
    lock: { ownerName: string } | null;
  }[];
};

export const EDIT_LOCK_TTL_MS = 90_000;

const locks = new Map<string, Map<string, StoredLease>>();
let nextLeaseId = 0;

const key = ({ targetId, targetType }: EditLockTarget) =>
  `${targetType}:${targetId}`;

const isTarget = (input: {
  targetId?: string | null;
  targetType?: string | null;
}): input is EditLockTarget =>
  Boolean(
    input.targetId &&
    input.targetType &&
    editLockTargetTypes.includes(input.targetType as EditLockTargetType),
  );

function nextId() {
  nextLeaseId += 1;
  return `mock-edit-lock-lease-${nextLeaseId}`;
}

function storeLease(
  input: EditLockTarget,
  lockedBy: string,
  lockedAt = new Date().toISOString(),
) {
  const lease: StoredLease = {
    ...input,
    leaseId: nextId(),
    locked: true,
    lockedAt,
    lockedBy,
  };
  const targetLeases = locks.get(key(input)) ?? new Map<string, StoredLease>();
  targetLeases.set(lease.leaseId, lease);
  locks.set(key(input), targetLeases);
  return lease;
}

function activeLeases(input: EditLockTarget) {
  const targetKey = key(input);
  const targetLeases = locks.get(targetKey);
  if (!targetLeases) return [];

  const now = Date.now();
  for (const [leaseId, lease] of targetLeases) {
    if (now - Date.parse(lease.lockedAt) >= EDIT_LOCK_TTL_MS)
      targetLeases.delete(leaseId);
  }
  if (targetLeases.size === 0) locks.delete(targetKey);
  return Array.from(targetLeases.values());
}

function visibleLease(input: EditLockTarget, viewerName: string) {
  const leases = activeLeases(input);
  return (
    leases.find(lease => lease.lockedBy !== viewerName) ?? leases.at(0) ?? null
  );
}

export function resetEditLockFixture() {
  locks.clear();
  nextLeaseId = 0;
  storeLease(
    {
      targetType: 'PROJECT_BLOCK',
      targetId: 'proposal-team-07:team-info',
    },
    'OOP 데모 학생 B',
  );
}

resetEditLockFixture();

export function isEditLockHeldByOther(
  input: EditLockTarget,
  ownerName: string,
) {
  return (
    activeLeases(input).find(lease => lease.lockedBy !== ownerName) ?? null
  );
}

export function findDocumentEditLockHeldByOther(
  targetType: EditLockTargetType,
  documentId: string,
  blockKeys: readonly string[],
  ownerName: string,
) {
  for (const blockKey of blockKeys) {
    const lock = isEditLockHeldByOther(
      { targetType, targetId: `${documentId}:${blockKey}` },
      ownerName,
    );
    if (lock) return lock;
  }
  return null;
}

/** 문서 조회 projection에 현재 살아 있는 동적 잠금을 합성한다. */
export function withDocumentEditLocks<D extends LockableDocument>(
  document: D,
  targetType: EditLockTargetType,
  viewerName: string,
) {
  const projected = structuredClone(document);
  projected.blocks.forEach(block => {
    const lease = visibleLease(
      {
        targetType,
        targetId: `${document.id}:${block.key}`,
      },
      viewerName,
    );
    if (lease) block.lock = { ownerName: lease.lockedBy };
  });
  return projected;
}

function badRequest() {
  return HttpResponse.json(
    {
      code: 'INVALID_EDIT_LOCK_TARGET',
      message: '편집 잠금 대상을 확인할 수 없어요.',
    },
    { status: 400 },
  );
}

function target(url: URL) {
  const input = {
    targetType: url.searchParams.get('targetType'),
    targetId: url.searchParams.get('targetId'),
  };
  return isTarget(input) ? input : null;
}

function releaseInput(url: URL): EditLockReleaseInput | null {
  const input = target(url);
  const leaseId = url.searchParams.get('leaseId');
  return input && leaseId ? { ...input, leaseId } : null;
}

export const editLockHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, ({ request }) => {
    const student = requireStudent(request, '편집 잠금');
    if ('response' in student) return student.response;
    const input = target(new URL(request.url));
    if (!input) return badRequest();
    const lock = visibleLease(input, student.name);
    return HttpResponse.json(
      lock
        ? { ...lock, leaseId: null }
        : {
            ...input,
            leaseId: null,
            locked: false,
            lockedAt: null,
            lockedBy: null,
          },
    );
  }),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
    async ({ request }) => {
      const student = requireStudent(request, '편집 잠금');
      if ('response' in student) return student.response;
      const body = (await request.json()) as Partial<EditLockAcquireInput>;
      const requestedLeaseId = body.leaseId;
      if (!isTarget(body)) return badRequest();
      const input: EditLockTarget = body;

      if (requestedLeaseId) {
        const existing = activeLeases(input).find(
          lease => lease.leaseId === requestedLeaseId,
        );
        if (!existing || existing.lockedBy !== student.name)
          return HttpResponse.json(
            {
              code: 'EDIT_LOCK_STALE',
              message: '편집 잠금이 만료되었어요. 다시 진입해 주세요.',
            },
            { status: 409 },
          );
        const refreshed: StoredLease = {
          ...existing,
          lockedAt: new Date().toISOString(),
        };
        locks.get(key(input))?.set(existing.leaseId, refreshed);
        return HttpResponse.json(refreshed);
      }

      const foreignLease = isEditLockHeldByOther(input, student.name);
      if (foreignLease)
        return HttpResponse.json(
          {
            code: 'EDIT_LOCKED',
            message: `${foreignLease.lockedBy}님이 편집 중이에요.`,
            ...foreignLease,
            leaseId: null,
          },
          { status: 409 },
        );
      return HttpResponse.json(storeLease(input, student.name));
    },
  ),
  http.delete(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`, ({ request }) => {
    const student = requireStudent(request, '편집 잠금');
    if ('response' in student) return student.response;
    const input = releaseInput(new URL(request.url));
    if (!input) return badRequest();
    const targetLeases = locks.get(key(input));
    const lease = targetLeases?.get(input.leaseId);
    if (lease?.lockedBy === student.name) targetLeases?.delete(input.leaseId);
    if (targetLeases?.size === 0) locks.delete(key(input));
    return new HttpResponse(null, { status: 204 });
  }),
];
