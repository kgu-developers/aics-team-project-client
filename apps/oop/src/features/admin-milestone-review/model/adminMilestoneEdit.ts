import type {
  AdminMilestoneScheduleDto,
  AdminMilestoneUpdateInput,
  AdminSectionMilestoneDto,
} from '@aics/api-client';

import {
  assertAdminMilestoneScheduleOrder,
  createAdminMilestoneSectionScheduleDraft,
  toAdminMilestoneDateTime,
  type AdminMilestoneSectionScheduleDraft,
} from './adminMilestoneSetupDraft';

function toDateTimeDraft(value: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!value) return { date: '', time: '' };

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  return match
    ? { date: match[1] ?? '', time: match[2] ?? '' }
    : { date: '', time: '' };
}

export function createAdminMilestoneSectionScheduleDraftFromDto(
  schedule: AdminMilestoneScheduleDto,
  status: AdminSectionMilestoneDto['status'],
  allowResubmissionBeforeDueAt: boolean,
): AdminMilestoneSectionScheduleDraft {
  return {
    ...createAdminMilestoneSectionScheduleDraft(),
    allowLateSubmission: Boolean(schedule.lateSubmissionUntil),
    allowSubmissionEditBeforeDueAt: allowResubmissionBeforeDueAt,
    dueAt: toDateTimeDraft(schedule.dueAt),
    evaluationClosesAt: toDateTimeDraft(schedule.evaluationClosesAt),
    evaluationOpensAt: toDateTimeDraft(schedule.evaluationOpensAt),
    isPublished: status === 'PUBLISHED',
    lateSubmissionUntil: toDateTimeDraft(schedule.lateSubmissionUntil),
    opensAt: toDateTimeDraft(schedule.opensAt),
  };
}

export function createAdminMilestoneUpdateInput({
  description,
  schedule,
  title,
  type,
}: {
  description: string;
  schedule: AdminMilestoneSectionScheduleDraft;
  title: string;
  type: AdminSectionMilestoneDto['type'];
}): AdminMilestoneUpdateInput {
  const isPresentationEvaluation = type === 'PRESENTATION';
  const lateSubmissionUntil = schedule.allowLateSubmission
    ? toAdminMilestoneDateTime(schedule.lateSubmissionUntil)
    : undefined;
  if (schedule.allowLateSubmission && !lateSubmissionUntil) {
    throw new Error('지각 제출 마감 일시를 입력해주세요.');
  }

  const opensAt = toAdminMilestoneDateTime(schedule.opensAt);
  const evaluationOpensAt = toAdminMilestoneDateTime(
    schedule.evaluationOpensAt,
  );
  const evaluationClosesAt = toAdminMilestoneDateTime(
    schedule.evaluationClosesAt,
  );
  const dueAt = isPresentationEvaluation
    ? evaluationClosesAt
    : toAdminMilestoneDateTime(schedule.dueAt);

  if (!dueAt) {
    throw new Error(
      isPresentationEvaluation
        ? '평가 종료 일시를 입력해주세요.'
        : '제출 마감 일시를 입력해주세요.',
    );
  }
  if (isPresentationEvaluation && !evaluationOpensAt) {
    throw new Error('평가 시작 일시를 입력해주세요.');
  }

  assertAdminMilestoneScheduleOrder({
    dueAt,
    evaluationClosesAt,
    evaluationOpensAt,
    lateSubmissionUntil,
    opensAt,
  });

  return {
    allowResubmissionBeforeDueAt: schedule.allowSubmissionEditBeforeDueAt,
    description: description.trim() || undefined,
    schedule: {
      dueAt,
      ...(evaluationClosesAt ? { evaluationClosesAt } : {}),
      ...(evaluationOpensAt ? { evaluationOpensAt } : {}),
      ...(isPresentationEvaluation
        ? { opensAt: evaluationOpensAt }
        : opensAt
          ? { opensAt }
          : {}),
      ...(lateSubmissionUntil ? { lateSubmissionUntil } : {}),
    },
    title: title.trim(),
    type,
  };
}
