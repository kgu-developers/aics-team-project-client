import type {
  AdminMilestoneScheduleDto,
  AdminMilestoneUpdateInput,
  AdminPeerEvaluationFormDto,
  AdminSectionMilestoneDto,
} from '@aics/api-client';

import {
  assertAdminMilestoneScheduleOrder,
  createAdminMilestoneSectionScheduleDraft,
  toAdminMilestoneDateTime,
  toAdminMilestoneDateTimeDraft,
  type AdminMilestoneSectionScheduleDraft,
} from './adminMilestoneSetupDraft';

export function createAdminMilestoneSectionScheduleDraftFromDto(
  schedule: AdminMilestoneScheduleDto,
  status: AdminSectionMilestoneDto['status'],
  allowResubmissionBeforeDueAt: boolean,
  type: AdminSectionMilestoneDto['type'],
  peerEvaluationForm?: AdminPeerEvaluationFormDto | null,
): AdminMilestoneSectionScheduleDraft {
  const isPeerEvaluation = type === 'PEER_EVALUATION';
  const evaluationClosesAt = isPeerEvaluation
    ? (peerEvaluationForm?.closesAt ??
      schedule.evaluationClosesAt ??
      schedule.dueAt)
    : schedule.evaluationClosesAt;
  const evaluationOpensAt = isPeerEvaluation
    ? (peerEvaluationForm?.opensAt ??
      schedule.evaluationOpensAt ??
      schedule.opensAt)
    : schedule.evaluationOpensAt;

  return {
    ...createAdminMilestoneSectionScheduleDraft(),
    allowLateSubmission: Boolean(schedule.lateSubmissionUntil),
    allowSubmissionEditBeforeDueAt: allowResubmissionBeforeDueAt,
    dueAt: toAdminMilestoneDateTimeDraft(
      isPeerEvaluation ? evaluationClosesAt : schedule.dueAt,
    ),
    evaluationClosesAt: toAdminMilestoneDateTimeDraft(evaluationClosesAt),
    evaluationOpensAt: toAdminMilestoneDateTimeDraft(evaluationOpensAt),
    isPublished: status === 'PUBLISHED',
    lateSubmissionUntil: toAdminMilestoneDateTimeDraft(
      schedule.lateSubmissionUntil,
    ),
    opensAt: toAdminMilestoneDateTimeDraft(
      isPeerEvaluation ? evaluationOpensAt : schedule.opensAt,
    ),
    revisionUntil: schedule.revisionUntil ?? null,
  };
}

export function createAdminMilestoneUpdateInput({
  anonymous,
  description,
  schedule,
  title,
  type,
}: {
  anonymous?: boolean;
  description: string;
  schedule: AdminMilestoneSectionScheduleDraft;
  title: string;
  type: AdminSectionMilestoneDto['type'];
}): AdminMilestoneUpdateInput {
  const evaluationOpensAtDraft = toAdminMilestoneDateTime(
    schedule.evaluationOpensAt,
  );
  const evaluationClosesAtDraft = toAdminMilestoneDateTime(
    schedule.evaluationClosesAt,
  );

  if (type === 'PEER_EVALUATION') {
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
      ...(anonymous === undefined ? {} : { anonymous }),
      description: description.trim() || undefined,
      schedule: {
        dueAt: evaluationClosesAtDraft,
        evaluationClosesAt: evaluationClosesAtDraft,
        evaluationOpensAt: evaluationOpensAtDraft,
        opensAt: evaluationOpensAtDraft,
      },
      title: title.trim(),
      type,
    };
  }

  const lateSubmissionUntil = schedule.allowLateSubmission
    ? toAdminMilestoneDateTime(schedule.lateSubmissionUntil)
    : undefined;
  if (schedule.allowLateSubmission && !lateSubmissionUntil) {
    throw new Error('지각 제출 마감 일시를 입력해주세요.');
  }

  const opensAt = toAdminMilestoneDateTime(schedule.opensAt);
  const dueAt = toAdminMilestoneDateTime(schedule.dueAt);

  if (!dueAt) {
    throw new Error('제출 마감 일시를 입력해주세요.');
  }

  const revisionUntil = schedule.revisionUntil ?? undefined;
  assertAdminMilestoneScheduleOrder({
    dueAt,
    evaluationClosesAt: evaluationClosesAtDraft,
    evaluationOpensAt: evaluationOpensAtDraft,
    lateSubmissionUntil,
    opensAt,
    revisionUntil,
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
      ...(revisionUntil ? { revisionUntil } : {}),
    },
    title: title.trim(),
    type,
  };
}
