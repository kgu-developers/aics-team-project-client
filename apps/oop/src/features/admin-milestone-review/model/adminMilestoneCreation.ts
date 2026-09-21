import type {
  AdminMilestoneCreateInput,
  AdminMilestoneType,
} from '@aics/api-client';

import {
  assertAdminMilestoneScheduleOrder,
  type AdminMilestoneSectionScheduleDraft,
  toAdminMilestoneDateTime,
} from './adminMilestoneSetupDraft';
import type { MilestoneTemplateId } from './milestoneTemplates';

const milestoneTypeByTemplateId = {
  'final-report': 'FINAL_REPORT',
  midterm: 'MID_REPORT',
  'peer-review': 'PEER_EVALUATION',
  'presentation-submit': 'PRESENTATION',
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
  if (!isSupportedMilestoneCreationTemplate(templateId)) {
    throw new Error('아직 생성할 수 없는 마일스톤 양식입니다.');
  }

  const opensAt = toAdminMilestoneDateTime(schedule.opensAt);
  const evaluationOpensAtDraft = toAdminMilestoneDateTime(
    schedule.evaluationOpensAt,
  );
  const evaluationClosesAtDraft = toAdminMilestoneDateTime(
    schedule.evaluationClosesAt,
  );
  const isPeerEvaluation = templateId === 'peer-review';
  const dueAt = isPeerEvaluation
    ? evaluationClosesAtDraft
    : toAdminMilestoneDateTime(schedule.dueAt);

  if (!dueAt) {
    throw new Error(
      isPeerEvaluation
        ? '상호 평가 종료 일시를 입력해주세요.'
        : '제출 마감 일시를 입력해주세요.',
    );
  }
  if (isPeerEvaluation) {
    if (!evaluationOpensAtDraft) {
      throw new Error('상호 평가 시작 일시를 입력해주세요.');
    }
    if (!evaluationClosesAtDraft) {
      throw new Error('상호 평가 종료 일시를 입력해주세요.');
    }
    if (evaluationOpensAtDraft >= evaluationClosesAtDraft) {
      throw new Error('평가 종료 일시는 평가 시작 일시보다 늦어야 합니다.');
    }

    return {
      allowResubmissionBeforeDueAt: schedule.allowSubmissionEditBeforeDueAt,
      description: description.trim() || undefined,
      schedule: {
        dueAt: evaluationClosesAtDraft,
        evaluationClosesAt: evaluationClosesAtDraft,
        evaluationOpensAt: evaluationOpensAtDraft,
        opensAt: evaluationOpensAtDraft,
      },
      title: title.trim(),
      type: milestoneTypeByTemplateId[templateId],
      weekNumber,
    };
  }

  const lateSubmissionUntil = schedule.allowLateSubmission
    ? toAdminMilestoneDateTime(schedule.lateSubmissionUntil)
    : undefined;

  if (schedule.allowLateSubmission && !lateSubmissionUntil) {
    throw new Error('지각 제출 마감 일시를 입력해주세요.');
  }

  assertAdminMilestoneScheduleOrder({
    dueAt,
    evaluationClosesAt: evaluationClosesAtDraft,
    evaluationOpensAt: evaluationOpensAtDraft,
    lateSubmissionUntil,
    opensAt,
  });

  return {
    allowResubmissionBeforeDueAt: schedule.allowSubmissionEditBeforeDueAt,
    description: description.trim() || undefined,
    schedule: {
      dueAt,
      ...(evaluationClosesAtDraft
        ? { evaluationClosesAt: evaluationClosesAtDraft }
        : {}),
      ...(evaluationOpensAtDraft
        ? { evaluationOpensAt: evaluationOpensAtDraft }
        : {}),
      ...(opensAt ? { opensAt } : {}),
      ...(lateSubmissionUntil ? { lateSubmissionUntil } : {}),
    },
    title: title.trim(),
    type: milestoneTypeByTemplateId[templateId],
    weekNumber,
  };
}
