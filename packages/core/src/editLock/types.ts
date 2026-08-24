export const editLockTargetTypes = [
  'PROJECT_BLOCK',
  'MID_REPORT_BLOCK',
  'PRESENTATION_CONTENT_BLOCK',
] as const;

export type EditLockTargetType = (typeof editLockTargetTypes)[number];

export type EditLockTarget = {
  targetType: EditLockTargetType;
  /** 문서 resource id와 해당 편집 섹션 key를 `:`로 결합한 식별자. */
  targetId: string;
};

/** 새 lease를 만들거나 이미 소유한 lease의 heartbeat를 갱신한다. */
export type EditLockAcquireInput = EditLockTarget & {
  leaseId?: string;
};

/** 현재 탭이 발급받은 lease만 정확히 해제한다. */
export type EditLockReleaseInput = EditLockTarget & {
  leaseId: string;
};

export type EditLockStatus = EditLockTarget & {
  /** 다른 사용자의 잠금 조회 결과에는 lease 식별자를 노출하지 않는다. */
  leaseId: string | null;
  locked: boolean;
  lockedAt: string | null;
  lockedBy: string | null;
};
