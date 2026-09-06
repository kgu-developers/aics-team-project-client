export type AdminMilestoneSectionScheduleDraft = {
  allowLateSubmission: boolean;
  allowSubmissionEditBeforeDueAt: boolean;
  dueAt: {
    date: string;
    time: string;
  };
  isPublished: boolean;
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

export function assertAdminMilestoneScheduleOrder({
  dueAt,
  lateSubmissionUntil,
  opensAt,
}: {
  dueAt: string;
  lateSubmissionUntil?: string;
  opensAt?: string;
}) {
  if (opensAt && opensAt >= dueAt) {
    throw new Error('공개 시작 일시는 제출 마감 일시보다 앞서야 합니다.');
  }
  if (lateSubmissionUntil && lateSubmissionUntil <= dueAt) {
    throw new Error('지각 제출 마감 일시는 제출 마감 일시보다 뒤여야 합니다.');
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
