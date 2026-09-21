import { formatCourseScheduleDateTime } from '~/shared/lib/formatCourseScheduleDateTime';
import { seoulInstant } from '~/shared/lib/seoulInstant';

export type AdminMilestoneSectionScheduleDraft = {
  allowLateSubmission: boolean;
  allowSubmissionEditBeforeDueAt: boolean;
  dueAt: {
    date: string;
    time: string;
  };
  evaluationClosesAt: {
    date: string;
    time: string;
  };
  evaluationOpensAt: {
    date: string;
    time: string;
  };
  isPublished: boolean;
  /**
   * Not editable in the form yet; kept from the server so a PUT (which
   * replaces the whole schedule) does not silently erase it.
   */
  revisionUntil?: string | null;
  lateSubmissionUntil: {
    date: string;
    time: string;
  };
  opensAt: {
    date: string;
    time: string;
  };
};

function createDateTimeDraft() {
  return { date: '', time: '' };
}

export function createAdminMilestoneSectionScheduleDraft(): AdminMilestoneSectionScheduleDraft {
  return {
    allowLateSubmission: false,
    allowSubmissionEditBeforeDueAt: false,
    dueAt: createDateTimeDraft(),
    evaluationClosesAt: createDateTimeDraft(),
    evaluationOpensAt: createDateTimeDraft(),
    isPublished: false,
    lateSubmissionUntil: createDateTimeDraft(),
    opensAt: createDateTimeDraft(),
  };
}

export function toAdminMilestoneDateTime(
  dateTime: Readonly<{ date: string; time: string }>,
) {
  if (!dateTime.date || !dateTime.time) return undefined;

  return `${dateTime.date}T${dateTime.time}:00`;
}

export function toAdminMilestoneDateTimeDraft(
  value: string | null | undefined,
): { date: string; time: string } {
  if (!value) return createDateTimeDraft();

  const formatted = formatCourseScheduleDateTime(value);
  const match = /^(\d{4}-\d{2}-\d{2})\/(\d{2}:\d{2})$/.exec(formatted);
  return match
    ? { date: match[1] ?? '', time: match[2] ?? '' }
    : createDateTimeDraft();
}

export function assertAdminMilestoneScheduleOrder({
  dueAt,
  evaluationClosesAt,
  evaluationOpensAt,
  lateSubmissionUntil,
  opensAt,
  revisionUntil,
}: {
  dueAt: string;
  evaluationClosesAt?: string;
  evaluationOpensAt?: string;
  lateSubmissionUntil?: string;
  opensAt?: string;
  revisionUntil?: string;
}) {
  const dueAtTime = seoulInstant(dueAt);
  const opensAtTime = opensAt ? seoulInstant(opensAt) : undefined;
  const lateSubmissionUntilTime = lateSubmissionUntil
    ? seoulInstant(lateSubmissionUntil)
    : undefined;
  const revisionUntilTime = revisionUntil
    ? seoulInstant(revisionUntil)
    : undefined;
  const evaluationOpensAtTime = evaluationOpensAt
    ? seoulInstant(evaluationOpensAt)
    : undefined;
  const evaluationClosesAtTime = evaluationClosesAt
    ? seoulInstant(evaluationClosesAt)
    : undefined;

  if (!Number.isFinite(dueAtTime)) {
    throw new Error('마일스톤 일정을 확인해주세요.');
  }
  if (opensAtTime !== undefined && !Number.isFinite(opensAtTime)) {
    throw new Error('마일스톤 일정을 확인해주세요.');
  }
  if (
    lateSubmissionUntilTime !== undefined &&
    !Number.isFinite(lateSubmissionUntilTime)
  ) {
    throw new Error('마일스톤 일정을 확인해주세요.');
  }
  if (revisionUntilTime !== undefined && !Number.isFinite(revisionUntilTime)) {
    throw new Error('수정 마감 일시를 확인해주세요.');
  }
  if (
    (evaluationOpensAtTime !== undefined &&
      !Number.isFinite(evaluationOpensAtTime)) ||
    (evaluationClosesAtTime !== undefined &&
      !Number.isFinite(evaluationClosesAtTime))
  ) {
    throw new Error('평가 기간 일시를 확인해주세요.');
  }
  if (opensAtTime !== undefined && opensAtTime >= dueAtTime) {
    throw new Error('공개 시작 일시는 제출 마감 일시보다 앞서야 합니다.');
  }
  if (
    lateSubmissionUntilTime !== undefined &&
    lateSubmissionUntilTime <= dueAtTime
  ) {
    throw new Error('지각 제출 마감 일시는 제출 마감 일시보다 뒤여야 합니다.');
  }
  if (evaluationOpensAt && !evaluationClosesAt) {
    throw new Error('평가 종료 일시를 입력해주세요.');
  }
  if (!evaluationOpensAt && evaluationClosesAt) {
    throw new Error('평가 시작 일시를 입력해주세요.');
  }
  if (
    evaluationOpensAtTime !== undefined &&
    evaluationClosesAtTime !== undefined &&
    evaluationOpensAtTime >= evaluationClosesAtTime
  ) {
    throw new Error('평가 종료 일시는 평가 시작 일시보다 늦어야 합니다.');
  }
  // Mirrors the server's MilestoneSchedule rules so the form explains a
  // rejection instead of a bare 400.
  if (
    evaluationOpensAtTime !== undefined &&
    evaluationOpensAtTime < dueAtTime
  ) {
    throw new Error(
      '평가 시작 일시는 제출 마감 일시 이후여야 합니다. 발표 평가는 자료 제출이 끝난 뒤에 시작됩니다.',
    );
  }
  const submissionOrRevisionUntilTime =
    revisionUntilTime ?? lateSubmissionUntilTime;
  if (
    evaluationOpensAtTime !== undefined &&
    submissionOrRevisionUntilTime !== undefined &&
    evaluationOpensAtTime < submissionOrRevisionUntilTime
  ) {
    throw new Error(
      '평가 시작 일시는 지각 제출·수정 마감 일시 이후여야 합니다.',
    );
  }
}

export function syncAdminMilestoneSectionScheduleDrafts(
  sectionIds: readonly string[],
  currentDrafts: Readonly<Record<string, AdminMilestoneSectionScheduleDraft>>,
) {
  return Object.fromEntries(
    sectionIds.map(sectionId => [
      sectionId,
      currentDrafts[sectionId] ?? createAdminMilestoneSectionScheduleDraft(),
    ]),
  ) as Record<string, AdminMilestoneSectionScheduleDraft>;
}
