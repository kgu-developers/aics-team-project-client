import type {
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

const milestonesBySectionId: Readonly<
  Record<string, readonly AdminSectionMilestoneDto[]>
> = {
  'oop-2026-2-01': sectionOneMilestones,
  'oop-2026-2-02': sectionTwoMilestones,
  '1': sectionOneMilestones,
  '2': sectionTwoMilestones,
};

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
