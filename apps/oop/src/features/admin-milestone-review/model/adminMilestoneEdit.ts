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
  peerEvaluationForm?: AdminPeerEvaluationFormDto | null,
): AdminMilestoneSectionScheduleDraft {
  const draft = {
    ...createAdminMilestoneSectionScheduleDraft(),
    allowLateSubmission: Boolean(schedule.lateSubmissionUntil),
    allowSubmissionEditBeforeDueAt: allowResubmissionBeforeDueAt,
    dueAt: toDateTimeDraft(schedule.dueAt),
    evaluationClosesAt: toDateTimeDraft(schedule.evaluationClosesAt),
    evaluationOpensAt: toDateTimeDraft(schedule.evaluationOpensAt),
    isPublished: status === 'PUBLISHED',
    lateSubmissionUntil: toDateTimeDraft(schedule.lateSubmissionUntil),
    opensAt: toDateTimeDraft(schedule.opensAt),
    revisionUntil: schedule.revisionUntil ?? null,
  };
  if (!peerEvaluationForm) return draft;

  return {
    ...draft,
    allowLateSubmission: false,
    allowSubmissionEditBeforeDueAt: false,
    dueAt: toDateTimeDraft(peerEvaluationForm.closesAt),
    evaluationClosesAt: toDateTimeDraft(peerEvaluationForm.closesAt),
    evaluationOpensAt: toDateTimeDraft(peerEvaluationForm.opensAt),
    lateSubmissionUntil: { date: '', time: '' },
    opensAt: { date: '', time: '' },
    revisionUntil: null,
  };
}

export function createAdminMilestoneUpdateInput({
  description,
  anonymous,
  schedule,
  title,
  type,
}: {
  description: string;
  anonymous?: boolean;
  schedule: AdminMilestoneSectionScheduleDraft;
  title: string;
  type: AdminSectionMilestoneDto['type'];
}): AdminMilestoneUpdateInput {
  const isPeerEvaluation = type === 'PEER_EVALUATION';
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
  const dueAt = isPeerEvaluation
    ? evaluationClosesAt
    : toAdminMilestoneDateTime(schedule.dueAt);

  if (!dueAt) {
    throw new Error(
      isPeerEvaluation
        ? '상호 평가 종료 일시를 입력해주세요.'
        : '제출 마감 일시를 입력해주세요.',
    );
  }

  const revisionUntil = schedule.revisionUntil ?? undefined;
  if (isPeerEvaluation) {
    if (typeof anonymous !== 'boolean') {
      throw new Error('상호 평가 양식 정보를 불러오지 못했습니다.');
    }
    if (!evaluationOpensAt || !evaluationClosesAt) {
      throw new Error('상호 평가 시작 일시를 입력해주세요.');
    }
    if (evaluationOpensAt >= evaluationClosesAt) {
      throw new Error('평가 종료 일시는 평가 시작 일시보다 늦어야 합니다.');
    }
  } else {
    assertAdminMilestoneScheduleOrder({
      dueAt,
      evaluationClosesAt,
      evaluationOpensAt,
      lateSubmissionUntil,
      opensAt,
      revisionUntil,
    });
  }

  return {
    allowResubmissionBeforeDueAt: schedule.allowSubmissionEditBeforeDueAt,
    ...(isPeerEvaluation ? { anonymous } : {}),
    description: description.trim() || undefined,
    schedule: {
      dueAt,
      ...(evaluationClosesAt ? { evaluationClosesAt } : {}),
      ...(evaluationOpensAt ? { evaluationOpensAt } : {}),
      ...(!isPeerEvaluation && opensAt ? { opensAt } : {}),
      ...(!isPeerEvaluation && lateSubmissionUntil
        ? { lateSubmissionUntil }
        : {}),
      ...(!isPeerEvaluation && revisionUntil ? { revisionUntil } : {}),
    },
    title: title.trim(),
    type,
  };
}
