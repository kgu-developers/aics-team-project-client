import type {
  AdminMilestoneCreateInput,
  AdminMilestoneType,
} from '@aics/api-client';

import {
  type AdminMilestoneSectionScheduleDraft,
  toAdminMilestoneDateTime,
} from './adminMilestoneSetupDraft';
import type { MilestoneTemplateId } from './milestoneTemplates';

const milestoneTypeByTemplateId = {
  'final-report': 'FINAL_REPORT',
  midterm: 'MID_REPORT',
  proposal: 'PROPOSAL',
} as const satisfies Partial<Record<MilestoneTemplateId, AdminMilestoneType>>;

export function isSupportedMilestoneCreationTemplate(
  templateId: MilestoneTemplateId,
): templateId is keyof typeof milestoneTypeByTemplateId {
  return templateId in milestoneTypeByTemplateId;
}

export function createAdminMilestoneCreateInput({
  description,
  schedule,
  templateId,
  title,
  weekNumber,
}: {
  description: string;
  schedule: AdminMilestoneSectionScheduleDraft;
  templateId: MilestoneTemplateId;
  title: string;
  weekNumber: number;
}): AdminMilestoneCreateInput {
  const dueAt = toAdminMilestoneDateTime(schedule.dueAt);

  if (!dueAt) throw new Error('제출 마감 일시를 입력해주세요.');
  if (!isSupportedMilestoneCreationTemplate(templateId)) {
    throw new Error('아직 생성할 수 없는 마일스톤 양식입니다.');
  }

  const opensAt = toAdminMilestoneDateTime(schedule.opensAt);
  const lateSubmissionUntil = schedule.allowLateSubmission
    ? toAdminMilestoneDateTime(schedule.lateSubmissionUntil)
    : undefined;

  if (schedule.allowLateSubmission && !lateSubmissionUntil) {
    throw new Error('지각 제출 마감 일시를 입력해주세요.');
  }

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
    type: milestoneTypeByTemplateId[templateId],
    weekNumber,
  };
}
