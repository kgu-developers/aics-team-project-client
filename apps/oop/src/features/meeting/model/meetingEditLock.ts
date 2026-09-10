import type { LiveEditLockTarget } from '@aics/core';

// A meeting is edited as a single document, including its metadata.
export function meetingEditLockTarget(
  meetingId: string,
): LiveEditLockTarget | null {
  const targetId = Number(meetingId);
  return /^[1-9]\d*$/.test(meetingId) && Number.isSafeInteger(targetId)
    ? { targetType: 'MEETING_RECORD', targetId, sectionKey: 'MEETING_RECORD' }
    : null;
}

export class MeetingEditLockError extends Error {
  constructor() {
    super(
      '편집 잠금을 확인하지 못해 저장을 멈췄어요. 입력 내용을 보관하고 회의록 상세에서 다시 수정해 주세요.',
    );
  }
}
