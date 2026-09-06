import type {
  AdminMilestoneScheduleDto,
  AdminMilestoneUpdateInput,
  AdminSectionMilestoneDto,
} from '@aics/api-client';

import {
  createAdminMilestoneSectionScheduleDraft,
  toAdminMilestoneDateTime,
  type AdminMilestoneSectionScheduleDraft,
} from './adminMilestoneSetupDraft';

function toDateTimeDraft(value: string | null | undefined) {
  if (!value) return { date: '', time: '' };

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value);
  return match ? { date: match[1], time: match[2] } : { date: '', time: '' };
}

export function createAdminMilestoneSectionScheduleDraftFromDto(
  schedule: AdminMilestoneScheduleDto,
  status: AdminSectionMilestoneDto['status'],
): AdminMilestoneSectionScheduleDraft {
  return {
    ...createAdminMilestoneSectionScheduleDraft(),
    allowLateSubmission: Boolean(schedule.lateSubmissionUntil),
    allowSubmissionEditBeforeDueAt: Boolean(schedule.revisionUntil),
    dueAt: toDateTimeDraft(schedule.dueAt),
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
  const dueAt = toAdminMilestoneDateTime(schedule.dueAt);
  if (!dueAt) throw new Error('제출 마감 일시를 입력해주세요.');

  const lateSubmissionUntil = schedule.allowLateSubmission
    ? toAdminMilestoneDateTime(schedule.lateSubmissionUntil)
    : undefined;
  if (schedule.allowLateSubmission && !lateSubmissionUntil) {
    throw new Error('지각 제출 마감 일시를 입력해주세요.');
  }

  const opensAt = toAdminMilestoneDateTime(schedule.opensAt);

  return {
    description: description.trim() || undefined,
    schedule: {
      dueAt,
      ...(opensAt ? { opensAt } : {}),
      ...(lateSubmissionUntil ? { lateSubmissionUntil } : {}),
      ...(schedule.allowSubmissionEditBeforeDueAt
        ? { revisionUntil: dueAt }
        : {}),
    },
    title: title.trim(),
    type,
  };
}
