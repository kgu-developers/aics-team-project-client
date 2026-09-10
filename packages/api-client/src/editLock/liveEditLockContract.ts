import {
  isSupportedLiveEditLockTarget,
  type LiveEditLockTarget,
  type LiveEditLockStatus,
} from '@aics/core';

export function assertLiveEditLockTarget(target: LiveEditLockTarget) {
  if (!isSupportedLiveEditLockTarget(target)) {
    throw new Error(
      '지원하는 문서 ID와 영역 키가 있는 편집 잠금 대상이 필요합니다.',
    );
  }
}

export function mapLiveEditLockStatus(value: unknown): LiveEditLockStatus {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('locked' in value) ||
    typeof value.locked !== 'boolean'
  ) {
    throw new Error('편집 잠금 응답을 확인할 수 없습니다.');
  }
  const body = value as Record<string, unknown>;
  if (
    (body.lockedBy != null && typeof body.lockedBy !== 'string') ||
    (body.lockedByName != null && typeof body.lockedByName !== 'string') ||
    (body.lockedAt != null && typeof body.lockedAt !== 'string')
  ) {
    throw new Error('편집 잠금 소유 정보를 확인할 수 없습니다.');
  }
  return {
    locked: value.locked,
    lockedBy: value.locked
      ? ((body.lockedBy as string | null | undefined) ?? null)
      : null,
    lockedAt: value.locked
      ? ((body.lockedAt as string | null | undefined) ?? null)
      : null,
    lockedByName: value.locked
      ? ((body.lockedByName as string | null | undefined) ?? null)
      : null,
  };
}
