export const liveEditLockTargetTypes = [
  'PROJECT',
  'MEETING_RECORD',
  'MID_REPORT',
  'MID_REPORT_BLOCK',
] as const;
export type LiveEditLockTargetType = (typeof liveEditLockTargetTypes)[number];
export type LiveEditLockTarget = {
  targetType: LiveEditLockTargetType;
  /** PROJECT: projectId; MEETING_RECORD: meetingRecordId; MID_REPORT*: midReportId. */
  targetId: number;
  /** Area inside the document, not the course sectionId. Preserve the agreed key. */
  sectionKey: string;
};
export type LiveEditLockStatusResponse = {
  locked: boolean;
  lockedBy?: string | null;
  lockedByName?: string | null;
  lockedAt?: string | null;
};
export type LiveEditLockStatus = {
  locked: boolean;
  /** Account/student-number ownership. This does not identify a browser tab. */
  lockedBy: string | null;
  lockedByName: string | null;
  lockedAt: string | null;
};

export function isSupportedLiveEditLockTarget(
  target:
    | { targetType?: unknown; targetId?: unknown; sectionKey?: unknown }
    | null
    | undefined,
): target is LiveEditLockTarget {
  return (
    (target?.targetType === 'PROJECT' ||
      target?.targetType === 'MEETING_RECORD' ||
      target?.targetType === 'MID_REPORT' ||
      target?.targetType === 'MID_REPORT_BLOCK') &&
    typeof target.targetId === 'number' &&
    Number.isSafeInteger(target.targetId) &&
    target.targetId > 0 &&
    typeof target.sectionKey === 'string' &&
    target.sectionKey.trim().length > 0 &&
    target.sectionKey.length <= 50
  );
}
