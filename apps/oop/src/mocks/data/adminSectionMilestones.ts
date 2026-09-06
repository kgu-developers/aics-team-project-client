import type {
  AdminMilestoneCreateInput,
  AdminMilestoneStatus,
  AdminMilestoneUpdateInput,
  AdminSectionMilestoneDto,
  AdminSectionMilestonesResponse,
} from '@aics/api-client';

const sectionOneMilestones: AdminSectionMilestoneDto[] = [
  {
    description: '프로젝트의 목표와 구성 방식을 정리합니다.',
    id: 101,
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
    description: '팀별 발표 순서와 동료 평가 기간을 관리합니다.',
    id: 103,
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
    description: '프로젝트 진행 상황과 설계 내용을 점검합니다.',
    id: 102,
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
];

const sectionTwoMilestones: AdminSectionMilestoneDto[] = [
  {
    description: '발표에 사용할 PDF, ZIP 파일과 시연 URL을 제출합니다.',
    id: 201,
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

const milestonesBySectionId: Record<string, AdminSectionMilestoneDto[]> = {
  'oop-2026-2-01': sectionOneMilestones,
  'oop-2026-2-02': sectionTwoMilestones,
  '1': sectionOneMilestones,
  '2': sectionTwoMilestones,
};

let nextMilestoneId = 300;

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

  Object.assign(milestone, input);
  return milestone;
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
