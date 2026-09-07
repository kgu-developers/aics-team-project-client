/** Server vocabulary; PROJECT is currently rejected by the deployed facade. */
export const liveEditLockTargetTypes = [
  'PROJECT',
  'PRESENTATION_CONTENT',
] as const;
export type LiveEditLockTargetType = (typeof liveEditLockTargetTypes)[number];
export type LiveEditLockTarget = {
  targetType: LiveEditLockTargetType;
  /** PRESENTATION_CONTENT uses submissionId, not a block or document string. */
  targetId: number;
};
export type LiveEditLockStatusResponse = {
  locked: boolean;
  lockedBy?: string | null;
  lockedAt?: string | null;
};
export type LiveEditLockStatus = {
  locked: boolean;
  /** Account/student-number ownership. This does not identify a browser tab. */
  lockedBy: string | null;
  lockedAt: string | null;
};

export function isSupportedLiveEditLockTarget(
  target: { targetType?: unknown; targetId?: unknown } | null | undefined,
): target is LiveEditLockTarget & { targetType: 'PRESENTATION_CONTENT' } {
  return (
    target?.targetType === 'PRESENTATION_CONTENT' &&
    typeof target.targetId === 'number' &&
    Number.isSafeInteger(target.targetId) &&
    target.targetId > 0
  );
}
