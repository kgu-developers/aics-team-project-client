import type {
  AdminMilestoneScheduleDto,
  AdminMilestoneUpdateInput,
  AdminPeerEvaluationFormDto,
  AdminSectionMilestoneDto,
} from '@aics/api-client';

import {
  toPresentationEvaluationPrerequisiteDateTime,
  toPresentationEvaluationSeoulDateTimeInput,
  toPresentationEvaluationServerDateTime,
} from '~/features/evaluation/presentationEvaluationDateTime';

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
  type: AdminSectionMilestoneDto['type'],
  peerEvaluationForm?: AdminPeerEvaluationFormDto | null,
): AdminMilestoneSectionScheduleDraft {
  const isPeerEvaluation = type === 'PEER_EVALUATION';
  const evaluationClosesAt =
    type === 'PRESENTATION'
      ? toPresentationEvaluationSeoulDateTimeInput(schedule.evaluationClosesAt)
      : isPeerEvaluation
        ? (peerEvaluationForm?.closesAt ??
          schedule.evaluationClosesAt ??
          schedule.dueAt)
        : schedule.evaluationClosesAt;
  const evaluationOpensAt =
    type === 'PRESENTATION'
      ? toPresentationEvaluationSeoulDateTimeInput(schedule.evaluationOpensAt)
      : isPeerEvaluation
        ? (peerEvaluationForm?.opensAt ??
          schedule.evaluationOpensAt ??
          schedule.opensAt)
        : schedule.evaluationOpensAt;

  return {
    ...createAdminMilestoneSectionScheduleDraft(),
    allowLateSubmission: Boolean(schedule.lateSubmissionUntil),
    allowSubmissionEditBeforeDueAt: allowResubmissionBeforeDueAt,
    dueAt: toDateTimeDraft(
      isPeerEvaluation ? evaluationClosesAt : schedule.dueAt,
    ),
    evaluationClosesAt: toDateTimeDraft(evaluationClosesAt),
    evaluationOpensAt: toDateTimeDraft(evaluationOpensAt),
    isPublished: status === 'PUBLISHED',
    lateSubmissionUntil: toDateTimeDraft(schedule.lateSubmissionUntil),
    opensAt: toDateTimeDraft(
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
  const isPresentation = type === 'PRESENTATION';
  const dueAtForComparison = isPresentation
    ? toPresentationEvaluationPrerequisiteDateTime(dueAt)
    : dueAt;
  const lateSubmissionUntilForComparison =
    isPresentation && lateSubmissionUntil
      ? toPresentationEvaluationPrerequisiteDateTime(lateSubmissionUntil)
      : lateSubmissionUntil;
  const revisionUntilForComparison =
    isPresentation && revisionUntil
      ? toPresentationEvaluationPrerequisiteDateTime(revisionUntil)
      : revisionUntil;
  if (
    isPresentation &&
    (!dueAtForComparison ||
      (lateSubmissionUntil && !lateSubmissionUntilForComparison))
  ) {
    throw new Error('마일스톤 일정을 확인해주세요.');
  }
  if (isPresentation && revisionUntil && !revisionUntilForComparison) {
    throw new Error('수정 마감 일시를 확인해주세요.');
  }
  assertAdminMilestoneScheduleOrder({
    dueAt: dueAtForComparison ?? dueAt,
    evaluationClosesAt: evaluationClosesAtDraft,
    evaluationOpensAt: evaluationOpensAtDraft,
    lateSubmissionUntil: lateSubmissionUntilForComparison,
    opensAt,
    revisionUntil: revisionUntilForComparison,
  });

  const evaluationOpensAt = isPresentation
    ? evaluationOpensAtDraft &&
      toPresentationEvaluationServerDateTime(evaluationOpensAtDraft)
    : evaluationOpensAtDraft;
  const evaluationClosesAt = isPresentation
    ? evaluationClosesAtDraft &&
      toPresentationEvaluationServerDateTime(evaluationClosesAtDraft)
    : evaluationClosesAtDraft;
  if (
    isPresentation &&
    ((evaluationOpensAtDraft && !evaluationOpensAt) ||
      (evaluationClosesAtDraft && !evaluationClosesAt))
  ) {
    throw new Error('평가 기간 일시를 확인해주세요.');
  }

  return {
    allowResubmissionBeforeDueAt: schedule.allowSubmissionEditBeforeDueAt,
    description: description.trim() || undefined,
    schedule: {
      dueAt,
      ...(evaluationClosesAt ? { evaluationClosesAt } : {}),
      ...(evaluationOpensAt ? { evaluationOpensAt } : {}),
      ...(opensAt ? { opensAt } : {}),
      ...(lateSubmissionUntil ? { lateSubmissionUntil } : {}),
      ...(revisionUntil ? { revisionUntil } : {}),
    },
    title: title.trim(),
    type,
  };
}
