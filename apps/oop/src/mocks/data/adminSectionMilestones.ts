import type {
  AdminMilestoneCreateInput,
  AdminMilestoneStatus,
  AdminMilestoneUpdateInput,
  AdminPeerEvaluationFormCreateInput,
  AdminSectionMilestoneDto,
  AdminSectionMilestonesResponse,
} from '@aics/api-client';

const sectionOneMilestones: AdminSectionMilestoneDto[] = [
  {
    allowResubmissionBeforeDueAt: true,
    description: '프로젝트의 목표와 구성 방식을 정리합니다.',
    id: 101,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-10-15T14:59:00Z',
      opensAt: '2026-10-01T00:00:00Z',
      revisionUntil: '2026-10-15T14:59:00Z',
    },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '제안서',
    type: 'PROPOSAL',
    weekNumber: 3,
  },
  {
    allowResubmissionBeforeDueAt: false,
    description: '발표에 사용할 PDF, ZIP 파일과 시연 URL을 제출합니다.',
    id: 106,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-11-13T14:59:00Z',
      opensAt: '2026-11-01T00:00:00Z',
    },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '발표 자료 제출',
    type: 'PRESENTATION',
    weekNumber: 9,
  },
  {
    allowResubmissionBeforeDueAt: false,
    description: '팀별 발표 순서와 동료 평가 기간을 관리합니다.',
    id: 103,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-11-26T09:00:00+09:00',
      evaluationClosesAt: '2026-11-26T09:00:00+09:00',
      evaluationOpensAt: '2026-11-19T09:00:00+09:00',
      opensAt: '2026-11-19T09:00:00+09:00',
    },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '발표 평가',
    type: 'PRESENTATION',
    weekNumber: 10,
  },
  {
    allowResubmissionBeforeDueAt: true,
    description: '프로젝트 진행 상황과 설계 내용을 점검합니다.',
    id: 102,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-11-12T14:59:00Z',
      lateSubmissionUntil: '2026-11-13T14:59:00Z',
      opensAt: '2026-11-01T00:00:00Z',
      revisionUntil: '2026-11-12T14:59:00Z',
    },
    sectionId: 1,
    status: 'DRAFT',
    title: '중간 점검',
    type: 'MID_REPORT',
    weekNumber: 7,
  },
  {
    allowResubmissionBeforeDueAt: false,
    description: '최종 보고서와 최종 소스코드를 제출합니다.',
    id: 104,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-12-07T14:59:00Z',
      opensAt: '2026-11-30T00:00:00Z',
    },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '최종 보고서',
    type: 'FINAL_REPORT',
    weekNumber: 12,
  },
  {
    allowResubmissionBeforeDueAt: false,
    description: '팀원 기여도와 프로젝트 평가를 제출합니다.',
    id: 105,
    peerEvaluationForm: {
      anonymous: false,
      closesAt: '2026-12-14T23:59:00',
      id: 501,
      milestoneId: 105,
      opensAt: '2026-12-08T09:00:00',
      sectionId: 1,
    },
    schedule: {
      dueAt: '2026-12-14T23:59:00',
      evaluationClosesAt: '2026-12-14T23:59:00',
      evaluationOpensAt: '2026-12-08T09:00:00',
      opensAt: '2026-12-08T09:00:00',
    },
    sectionId: 1,
    status: 'PUBLISHED',
    title: '상호 평가',
    type: 'PEER_EVALUATION',
    weekNumber: 13,
  },
];

const sectionTwoMilestones: AdminSectionMilestoneDto[] = [
  {
    allowResubmissionBeforeDueAt: false,
    description: '발표에 사용할 PDF, ZIP 파일과 시연 URL을 제출합니다.',
    id: 201,
    peerEvaluationForm: null,
    schedule: {
      dueAt: '2026-11-26T14:59:00Z',
      opensAt: '2026-11-15T00:00:00Z',
    },
    sectionId: 2,
    status: 'PUBLISHED',
    title: '발표 자료 제출',
    type: 'PRESENTATION',
    weekNumber: 9,
  },
];

const initialSectionOneMilestones = structuredClone(sectionOneMilestones);
const initialSectionTwoMilestones = structuredClone(sectionTwoMilestones);

const milestonesBySectionId: Record<string, AdminSectionMilestoneDto[]> = {
  'oop-2026-2-01': sectionOneMilestones,
  'oop-2026-2-02': sectionTwoMilestones,
  '1': sectionOneMilestones,
  '2': sectionTwoMilestones,
};
const initialMilestoneSectionIds = new Set(Object.keys(milestonesBySectionId));

let nextMilestoneId = 300;

export function resetAdminSectionMilestonesFixture() {
  sectionOneMilestones.splice(
    0,
    sectionOneMilestones.length,
    ...structuredClone(initialSectionOneMilestones),
  );
  sectionTwoMilestones.splice(
    0,
    sectionTwoMilestones.length,
    ...structuredClone(initialSectionTwoMilestones),
  );
  Object.keys(milestonesBySectionId).forEach(sectionId => {
    if (!initialMilestoneSectionIds.has(sectionId)) {
      delete milestonesBySectionId[sectionId];
    }
  });
  nextMilestoneId = 300;
}

export function ensureAdminSectionMilestonesFixture(sectionId: string) {
  milestonesBySectionId[sectionId] ??= [];
  return { content: [...milestonesBySectionId[sectionId]] };
}

export function getAdminSectionMilestonesFixture(
  sectionId: string,
): AdminSectionMilestonesResponse | undefined {
  const content = milestonesBySectionId[sectionId];

  return content ? { content: [...content] } : undefined;
}

export function getAdminSectionMilestoneFixture(
  sectionId: string,
  milestoneId: string,
): AdminSectionMilestoneDto | undefined {
  return milestonesBySectionId[sectionId]?.find(
    milestone => milestone.id === Number(milestoneId),
  );
}

export function createAdminSectionMilestoneFixture(
  sectionId: string,
  input: AdminMilestoneCreateInput,
) {
  const milestones = milestonesBySectionId[sectionId];
  if (!milestones) return undefined;

  const milestone: AdminSectionMilestoneDto = {
    ...input,
    id: nextMilestoneId++,
    peerEvaluationForm: null,
    schedule: input.schedule,
    sectionId: Number(sectionId) || 1,
    status: 'DRAFT',
  };
  milestones.push(milestone);
  return milestone;
}

export function updateAdminSectionMilestoneFixtureStatus(
  sectionId: string,
  milestoneId: string,
  status: AdminMilestoneStatus,
) {
  const milestone = milestonesBySectionId[sectionId]?.find(
    candidate => candidate.id === Number(milestoneId),
  );
  if (!milestone) return undefined;

  milestone.status = status;
  return milestone;
}

export function updateAdminSectionMilestoneFixture(
  sectionId: string,
  milestoneId: string,
  input: AdminMilestoneUpdateInput,
) {
  const milestone = milestonesBySectionId[sectionId]?.find(
    candidate => candidate.id === Number(milestoneId),
  );
  if (!milestone) return undefined;

  if (milestone.type === 'PEER_EVALUATION') {
    const { evaluationClosesAt, evaluationOpensAt } = input.schedule;
    milestone.allowResubmissionBeforeDueAt = input.allowResubmissionBeforeDueAt;
    milestone.description = input.description;
    milestone.schedule = {
      dueAt: evaluationClosesAt,
      evaluationClosesAt,
      evaluationOpensAt,
      opensAt: evaluationOpensAt,
    };
    milestone.title = input.title;
    milestone.type = input.type;
    if (milestone.peerEvaluationForm) {
      milestone.peerEvaluationForm = {
        ...milestone.peerEvaluationForm,
        ...(input.anonymous === undefined
          ? {}
          : { anonymous: input.anonymous }),
        closesAt: evaluationClosesAt!,
        opensAt: evaluationOpensAt!,
      };
    }
    return milestone;
  }

  Object.assign(milestone, input);
  return milestone;
}

export function createAdminPeerEvaluationFormFixture(
  sectionId: string,
  formId: number,
  input: AdminPeerEvaluationFormCreateInput,
) {
  const milestone = milestonesBySectionId[sectionId]?.find(
    candidate => candidate.id === input.milestoneId,
  );
  if (!milestone || milestone.type !== 'PEER_EVALUATION')
    return { error: 'MILESTONE_NOT_FOUND' } as const;
  if (milestone.peerEvaluationForm)
    return { error: 'PEER_EVALUATION_FORM_ALREADY_EXISTS' } as const;

  milestone.peerEvaluationForm = {
    anonymous: input.anonymous,
    closesAt: input.closesAt,
    id: formId,
    milestoneId: input.milestoneId,
    opensAt: input.opensAt,
    sectionId: milestone.sectionId,
  };
  milestone.schedule = {
    ...milestone.schedule,
    dueAt: input.closesAt,
    evaluationClosesAt: input.closesAt,
    evaluationOpensAt: input.opensAt,
    opensAt: input.opensAt,
  };
  return { form: milestone.peerEvaluationForm } as const;
}

/** Mirrors the server's independent PRESENTATION evaluation-window rules. */
export function updateAdminSectionMilestoneFixtureEvaluationWindow(
  sectionId: string,
  milestoneId: string,
  input: {
    clearEvaluationWindow?: boolean;
    evaluationClosesAt?: string;
    evaluationOpensAt?: string;
  },
): { error: string } | { milestone: AdminSectionMilestoneDto } {
  const milestone = milestonesBySectionId[sectionId]?.find(
    candidate => candidate.id === Number(milestoneId),
  );
  if (!milestone) return { error: 'MILESTONE_NOT_FOUND' };
  const currentOpensAt = milestone.schedule.evaluationOpensAt;
  const hasStarted =
    milestone.type === 'PRESENTATION' &&
    Number.isFinite(Date.parse(currentOpensAt ?? '')) &&
    Date.now() >= Date.parse(currentOpensAt!);
  if (
    hasStarted &&
    (input.clearEvaluationWindow ||
      input.evaluationOpensAt === undefined ||
      input.evaluationOpensAt !== currentOpensAt)
  ) {
    return { error: 'MILESTONE_EVALUATION_WINDOW_CONFLICT' };
  }
  if (input.clearEvaluationWindow) {
    milestone.schedule = {
      ...milestone.schedule,
      evaluationClosesAt: null,
      evaluationOpensAt: null,
    };
    return { milestone };
  }
  const { evaluationClosesAt, evaluationOpensAt } = input;
  if (!evaluationOpensAt || !evaluationClosesAt)
    return { error: 'INVALID_MILESTONE_REQUEST' };
  if (evaluationOpensAt >= evaluationClosesAt)
    return { error: 'INVALID_MILESTONE_REQUEST' };
  milestone.schedule = {
    ...milestone.schedule,
    evaluationClosesAt,
    evaluationOpensAt,
  };
  return { milestone };
}

function formatMockSeoulDateTime(instant = Date.now()) {
  return new Date(instant + 9 * 60 * 60 * 1000).toISOString().slice(0, 19);
}

export function closeAdminPresentationEvaluationFixture(
  sectionId: string,
  milestoneId: string,
) {
  const milestone = getAdminSectionMilestoneFixture(sectionId, milestoneId);
  if (!milestone) return { error: 'MILESTONE_NOT_FOUND' } as const;
  const now = Date.now();
  const opensAt = Date.parse(milestone.schedule.evaluationOpensAt ?? '');
  const closesAt = Date.parse(milestone.schedule.evaluationClosesAt ?? '');
  if (
    milestone.type !== 'PRESENTATION' ||
    !Number.isFinite(opensAt) ||
    !Number.isFinite(closesAt) ||
    now <= opensAt ||
    now >= closesAt
  ) {
    return { error: 'MILESTONE_EVALUATION_WINDOW_CONFLICT' } as const;
  }
  milestone.schedule = {
    ...milestone.schedule,
    evaluationClosesAt: formatMockSeoulDateTime(now),
  };
  return { milestone } as const;
}

export function reopenAdminPresentationEvaluationFixture(
  sectionId: string,
  milestoneId: string,
  evaluationClosesAt: string | undefined,
) {
  const milestone = getAdminSectionMilestoneFixture(sectionId, milestoneId);
  if (!milestone) return { error: 'MILESTONE_NOT_FOUND' } as const;
  const now = Date.now();
  const opensAt = Date.parse(milestone.schedule.evaluationOpensAt ?? '');
  const previousClosesAt = Date.parse(
    milestone.schedule.evaluationClosesAt ?? '',
  );
  const nextClosesAt = Date.parse(evaluationClosesAt ?? '');
  if (
    milestone.type !== 'PRESENTATION' ||
    !Number.isFinite(opensAt) ||
    !Number.isFinite(previousClosesAt) ||
    !Number.isFinite(nextClosesAt) ||
    now < opensAt ||
    now < previousClosesAt ||
    nextClosesAt <= now
  ) {
    return { error: 'MILESTONE_EVALUATION_WINDOW_CONFLICT' } as const;
  }
  milestone.schedule = {
    ...milestone.schedule,
    evaluationClosesAt: evaluationClosesAt!,
  };
  return { milestone } as const;
}

export function updateAdminSectionMilestoneFixtureWeekNumbers(
  sectionId: string,
  changes: readonly { milestoneId: number; weekNumber: number }[],
) {
  const milestones = milestonesBySectionId[sectionId];
  if (!milestones) return undefined;

  const milestoneIds = new Set(milestones.map(milestone => milestone.id));
  if (
    changes.length === 0 ||
    changes.some(
      change =>
        !milestoneIds.has(change.milestoneId) ||
        !Number.isInteger(change.weekNumber) ||
        change.weekNumber < 1,
    )
  ) {
    return null;
  }

  const nextWeekNumberById = new Map(
    changes.map(change => [change.milestoneId, change.weekNumber]),
  );
  const nextWeekNumbers = milestones.map(
    milestone => nextWeekNumberById.get(milestone.id) ?? milestone.weekNumber,
  );
  if (new Set(nextWeekNumbers).size !== nextWeekNumbers.length) return null;

  for (const milestone of milestones) {
    const weekNumber = nextWeekNumberById.get(milestone.id);
    if (weekNumber !== undefined) milestone.weekNumber = weekNumber;
  }
  return milestones;
}
