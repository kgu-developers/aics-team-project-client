import type { AdminPresentationEvaluationsResponse } from '@aics/api-client';

export const adminPresentationEvaluationsFixture: AdminPresentationEvaluationsResponse =
  {
    section: { id: 'oop-2026-2-01', label: 'OOP-01' },
    evaluationPeriod: {
      startsAt: '2026-11-19T09:00:00+09:00',
      endsAt: '2026-11-26T18:00:00+09:00',
    },
    criteria: [
      { id: 'completion', label: '프로젝트 완성도' },
      { id: 'implementation', label: '기능 구성과 구현' },
      { id: 'delivery', label: '발표 전달력' },
    ],
    teams: [
      {
        submissionId: 'submission-oop-01-1-presentation-evaluate',
        teamId: 'team-1151-1',
        teamName: 'OOP-01 - 1팀',
        projectTopic: 'AI 기반 팀 프로젝트 관리 서비스',
        presentationOrder: 1,
        submittedEvaluatorCount: 2,
        evaluatorCount: 2,
        criteria: { completion: 5, implementation: 4, delivery: 5 },
      },
      {
        submissionId: 'submission-oop-01-2-presentation-evaluate',
        teamId: 'team-1151-2',
        teamName: 'OOP-01 - 2팀',
        projectTopic: '캠퍼스 학습 일정 관리 서비스',
        presentationOrder: 2,
        submittedEvaluatorCount: 0,
        evaluatorCount: 2,
        criteria: { completion: null, implementation: null, delivery: null },
      },
    ],
  };
