import type {
  AdminPeerEvaluationListResponse,
  AdminPeerEvaluationTeamDetailResponse,
  AdminPresentationEvaluationListResponse,
  AdminPresentationEvaluationTeamDetailResponse,
} from '@aics/api-client';

export const adminPeerEvaluationListFixture: AdminPeerEvaluationListResponse = {
  closesAt: '2026-12-14T14:59:00+09:00',
  formId: 501,
  opensAt: '2026-12-08T00:00:00+09:00',
  sectionId: 1,
  teams: [
    {
      lastSubmittedAt: '2026-12-13T13:00:00+09:00',
      meetingRecordCount: 2,
      submittedCount: 2,
      teamId: 1,
      teamName: 'OOP-01 - 1팀',
      totalMemberCount: 2,
    },
    {
      lastSubmittedAt: null,
      meetingRecordCount: 1,
      submittedCount: 0,
      teamId: 2,
      teamName: 'OOP-01 - 2팀',
      totalMemberCount: 2,
    },
  ],
};

export const adminPeerEvaluationDetailFixture: AdminPeerEvaluationTeamDetailResponse =
  {
    closesAt: '2026-12-14T14:59:00+09:00',
    formId: 501,
    teamId: 1,
    teamName: 'OOP-01 - 1팀',
    members: [
      {
        averageReceivedScore: 50,
        isLeader: true,
        name: '김민준',
        role: '팀장',
        userId: '20231234',
      },
      {
        averageReceivedScore: 50,
        isLeader: false,
        name: '이서연',
        role: '프론트엔드',
        userId: '20235678',
      },
    ],
    evaluations: [
      {
        averageScore: 50,
        evaluatorId: '20231234',
        evaluatorName: '김민준',
        isLeader: true,
        projectReviewComment: '역할 분담이 원활했습니다.',
        reflectionComment: '일정을 더 일찍 공유하겠습니다.',
        scores: [
          {
            contributionPercent: null,
            isSelf: true,
            targetUserId: '20231234',
            targetUserName: '김민준',
          },
          {
            contributionPercent: 50,
            isSelf: false,
            targetUserId: '20235678',
            targetUserName: '이서연',
          },
        ],
        selfContribution: 'API 설계와 팀 조율을 담당했습니다.',
        status: 'SUBMITTED',
        submittedAt: '2026-12-13T13:00:00+09:00',
        teammateAssessments: [
          {
            contributionDetail: '발표 자료와 UI를 완성했습니다.',
            targetUserId: '20235678',
            targetUserName: '이서연',
            teammateAssessment: '협업이 원활했습니다.',
          },
        ],
      },
      {
        averageScore: 50,
        evaluatorId: '20235678',
        evaluatorName: '이서연',
        isLeader: false,
        projectReviewComment: '완성도 높은 결과물이었습니다.',
        reflectionComment: '테스트를 더 보강하겠습니다.',
        scores: [
          {
            contributionPercent: 50,
            isSelf: false,
            targetUserId: '20231234',
            targetUserName: '김민준',
          },
          {
            contributionPercent: null,
            isSelf: true,
            targetUserId: '20235678',
            targetUserName: '이서연',
          },
        ],
        selfContribution: 'UI 구현과 발표 자료를 담당했습니다.',
        status: 'SUBMITTED',
        submittedAt: '2026-12-13T14:00:00+09:00',
        teammateAssessments: [
          {
            contributionDetail: 'API 설계와 일정 관리를 담당했습니다.',
            targetUserId: '20231234',
            targetUserName: '김민준',
            teammateAssessment: '팀 조율에 기여했습니다.',
          },
        ],
      },
    ],
    meetingRecords: [
      {
        id: 1,
        meetingAt: '2026-10-01T14:00:00+09:00',
        participantCount: 2,
        phase: 'MID_CHECK',
        title: '프로젝트 킥오프',
      },
    ],
  };

export const adminPeerEvaluationTeamTwoDetailFixture: AdminPeerEvaluationTeamDetailResponse =
  {
    closesAt: adminPeerEvaluationListFixture.closesAt,
    formId: 501,
    teamId: 2,
    teamName: 'OOP-01 - 2팀',
    members: [
      {
        averageReceivedScore: null,
        isLeader: true,
        name: '박지훈',
        role: '팀장',
        userId: '20239876',
      },
      {
        averageReceivedScore: null,
        isLeader: false,
        name: '최유진',
        role: '팀원',
        userId: '20234567',
      },
    ],
    evaluations: [],
    meetingRecords: [
      {
        id: 2,
        meetingAt: '2026-10-08T14:00:00+09:00',
        participantCount: 2,
        phase: 'MID_CHECK',
        title: '2팀 프로젝트 킥오프',
      },
    ],
  };

export const adminPresentationEvaluationListFixture: AdminPresentationEvaluationListResponse =
  {
    closesAt: '2026-11-26T09:00:00+09:00',
    milestoneId: 103,
    milestoneTitle: '발표 평가',
    sectionId: 1,
    criteria: [
      {
        criterionId: 1,
        displayOrder: 1,
        maxScore: 10,
        title: '프로젝트 완성도',
      },
      { criterionId: 2, displayOrder: 2, maxScore: 10, title: '발표 전달력' },
    ],
    teams: [
      {
        evaluationCount: 2,
        projectTitle: 'AI 기반 팀 프로젝트 관리 서비스',
        scores: [
          { criterionId: 1, criterionTitle: '프로젝트 완성도', score: 9 },
          { criterionId: 2, criterionTitle: '발표 전달력', score: 8 },
        ],
        teamId: 1,
        teamName: 'OOP-01 - 1팀',
        totalScore: 17,
      },
      {
        evaluationCount: 0,
        projectTitle: '캠퍼스 학습 일정 관리 서비스',
        scores: [],
        teamId: 2,
        teamName: 'OOP-01 - 2팀',
        totalScore: null,
      },
    ],
  };

export const adminPresentationEvaluationDetailFixture: AdminPresentationEvaluationTeamDetailResponse =
  {
    closesAt: '2026-11-26T09:00:00+09:00',
    criteria: adminPresentationEvaluationListFixture.criteria,
    evaluations: [
      {
        evaluatorId: '20239876',
        evaluatorName: '박지훈',
        isSubmitted: true,
        scores: [
          { criterionId: 1, criterionTitle: '프로젝트 완성도', score: 9 },
          { criterionId: 2, criterionTitle: '발표 전달력', score: 8 },
        ],
        submittedAt: '2026-11-25T10:00:00+09:00',
        teamName: 'OOP-01 - 2팀',
        totalScore: 17,
      },
    ],
    meetingRecords: adminPeerEvaluationDetailFixture.meetingRecords,
    milestoneId: 103,
    projectTitle: 'AI 기반 팀 프로젝트 관리 서비스',
    teamId: 1,
    teamName: 'OOP-01 - 1팀',
  };

export const adminPresentationEvaluationTeamTwoDetailFixture: AdminPresentationEvaluationTeamDetailResponse =
  {
    closesAt: adminPresentationEvaluationListFixture.closesAt,
    criteria: adminPresentationEvaluationListFixture.criteria,
    evaluations: [],
    meetingRecords: adminPeerEvaluationTeamTwoDetailFixture.meetingRecords,
    milestoneId: adminPresentationEvaluationListFixture.milestoneId,
    projectTitle: '캠퍼스 학습 일정 관리 서비스',
    teamId: 2,
    teamName: 'OOP-01 - 2팀',
  };
