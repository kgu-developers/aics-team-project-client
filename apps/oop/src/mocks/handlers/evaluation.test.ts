import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  StudentHomeDashboard,
  SubmitPeerEvaluationResponseInput,
} from '@aics/core';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { evaluationHandlers } from './evaluation';
import { studentHomeHandlers } from './studentHome';
import {
  evaluationSectionId,
  evaluationTeamId,
  peerEvaluationFormId,
  presentationEvaluationClosesAt,
  presentationEvaluationMilestoneId,
  presentationEvaluationOpensAt,
  resetEvaluationMockData,
  setEvaluationWindowStates,
} from '../data/evaluation';
import {
  demoAccessToken,
  demoOtherSectionAccessToken,
  demoOtherSectionStudent,
  demoPartnerAccessToken,
  demoStudent,
} from '../data/users';

const server = setupServer(...evaluationHandlers, ...studentHomeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => resetEvaluationMockData());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function request(
  path: string,
  init: RequestInit = {},
  token = demoAccessToken,
) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      ...init.headers,
    },
  });
}

function contributionAnswers(total = 100) {
  const base = Math.floor(total / 3);
  const percentages = [total - base * 2, base, base];
  return ['20260003', '20260004', '20260005'].map((targetUserId, index) => ({
    kind: 'TEAMMATE_CONTRIBUTION' as const,
    targetUserId,
    contributionPercent: percentages[index] ?? 0,
    contributionDetail: `팀원 ${index + 1}의 구체적인 기여`,
    teammateAssessment: `팀원 ${index + 1} 한줄평가`,
  }));
}

const presentationScores = [
  { criterionId: 'project-completeness', score: 5 },
  { criterionId: 'feature-implementation', score: 4 },
  { criterionId: 'presentation-delivery', score: 3 },
];

async function getDashboardPreview(
  scenario: 'presentation-evaluation' | 'peer-evaluation',
) {
  const response = await request(
    ENDPOINTS.SECTION.STUDENT_DASHBOARD(evaluationSectionId),
    { headers: { 'X-OOP-Milestone-Preview': scenario } },
  );
  expect(response.status).toBe(200);
  return (await response.json()) as StudentHomeDashboard;
}

describe('evaluationHandlers', () => {
  it('분반의 활성 평가 리소스 ID를 서버 projection으로 제공한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.CONTEXT('oop-2026-2-01'),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      presentationMilestoneId: presentationEvaluationMilestoneId,
      peerEvaluationFormId,
    });
  });

  it('다른 분반 학생에게 평가 리소스와 대시보드 데이터를 노출하지 않는다', async () => {
    const context = await request(
      ENDPOINTS.EVALUATION.CONTEXT(evaluationSectionId),
      {},
      demoOtherSectionAccessToken,
    );
    const peerTargets = await request(
      ENDPOINTS.EVALUATION.PEER_TARGETS(peerEvaluationFormId),
      {},
      demoOtherSectionAccessToken,
    );
    const dashboard = await request(
      ENDPOINTS.SECTION.STUDENT_DASHBOARD(evaluationSectionId),
      { headers: { 'X-OOP-Milestone-Preview': 'peer-evaluation' } },
      demoOtherSectionAccessToken,
    );

    expect(context.status).toBe(403);
    await expect(context.json()).resolves.toMatchObject({
      code: 'SECTION_ACCESS_DENIED',
    });
    expect(peerTargets.status).toBe(403);
    await expect(peerTargets.json()).resolves.toEqual({
      code: 'EVALUATION_ACCESS_DENIED',
      message: '다른 분반의 평가 리소스에는 접근할 수 없어요.',
    });
    expect(dashboard.status).toBe(403);
    await expect(dashboard.json()).resolves.toMatchObject({
      code: 'SECTION_ACCESS_DENIED',
    });
  });

  it('로그인 학생의 팀 멤버십으로 내 팀 발표 표시를 계산한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      evaluationOpensAt: presentationEvaluationOpensAt,
      evaluationClosesAt: presentationEvaluationClosesAt,
      windowState: 'OPEN',
    });
    expect(body.teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: evaluationTeamId, isMyTeam: true }),
        expect.objectContaining({ id: 'team-01', isMyTeam: false }),
      ]),
    );
  });

  it('상호평가 대상에서 로그인한 학생 본인을 제외한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.PEER_TARGETS(peerEvaluationFormId),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.targets).toHaveLength(3);
    expect(body.targets).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: demoStudent.studentNumber }),
        expect.objectContaining({
          userId: demoOtherSectionStudent.studentNumber,
        }),
      ]),
    );
  });

  it('학생이 자기 팀의 발표를 평가하지 못하게 한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: evaluationTeamId,
          scores: [
            { criterionId: 'project-completeness', score: 4 },
            { criterionId: 'feature-implementation', score: 4 },
            { criterionId: 'presentation-delivery', score: 4 },
          ],
          submit: true,
        }),
      },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: 'OWN_TEAM_NOT_ALLOWED',
    });
  });

  it('발표 평가 제출 뒤에는 로그인한 학생의 내역만 반환한다', async () => {
    const submitResponse = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: 'team-01',
          scores: presentationScores,
          submit: true,
        }),
      },
    );
    expect(submitResponse.status).toBe(200);

    const mine = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    await expect(mine.json()).resolves.toMatchObject({
      myEvaluations: [{ rateeTeamId: 'team-01', status: 'SUBMITTED' }],
    });

    const anotherStudent = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
      {},
      demoPartnerAccessToken,
    );
    await expect(anotherStudent.json()).resolves.toMatchObject({
      myEvaluations: [],
    });
  });

  it('발표 평가 임시 저장과 제출 뒤 대시보드 재조회에 진행 상태를 반영한다', async () => {
    const draft = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: 'team-01',
          scores: [presentationScores[0]],
          submit: false,
        }),
      },
    );
    expect(draft.status).toBe(200);

    const draftDashboard = await getDashboardPreview('presentation-evaluation');
    expect(
      draftDashboard.milestones.find(
        milestone => milestone.id === 'presentation',
      )?.rows[0],
    ).toMatchObject({ value: '작성 중 1/2팀', actionLabel: '이어 평가' });
    expect(
      draftDashboard.milestones.find(
        milestone => milestone.id === 'presentation',
      ),
    ).toMatchObject({ currentStepLabel: '발표 평가', status: 'in-progress' });

    const submit = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: 'team-01',
          scores: presentationScores,
          submit: true,
        }),
      },
    );
    expect(submit.status).toBe(200);

    const submittedDashboard = await getDashboardPreview(
      'presentation-evaluation',
    );
    expect(
      submittedDashboard.milestones.find(
        milestone => milestone.id === 'presentation',
      )?.rows[0],
    ).toMatchObject({ value: '제출 완료 1/2팀', actionLabel: '평가 계속' });
  });

  it('상호평가 최종 제출 시 팀원 기여도 합계 100점을 검증한다', async () => {
    const input: SubmitPeerEvaluationResponseInput = {
      selfContribution: '문서와 화면 구현을 맡았습니다.',
      projectReviewComment: '협업 흐름이 좋았지만 일정 관리가 아쉬웠습니다.',
      answers: [
        ...contributionAnswers(90),
        {
          kind: 'REFLECTION',
          comment: '함께 끝까지 구현한 팀원들을 칭찬합니다.',
        },
      ],
      submit: true,
    };

    const response = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      { method: 'POST', body: JSON.stringify(input) },
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: 'CONTRIBUTION_SUM_INVALID',
    });
  });

  it('상호평가의 잘못된 필드 형식을 계약 오류로 반환한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      {
        method: 'POST',
        body: JSON.stringify({ answers: [], submit: true }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_REQUEST',
    });
  });

  it('발표 수업 종료 후에도 발표 평가는 저장하고 상호평가는 종료 정책을 유지한다', async () => {
    setEvaluationWindowStates('CLOSED', 'CLOSED');

    const presentation = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: 'team-01',
          scores: [],
          submit: false,
        }),
      },
    );
    const peer = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      {
        method: 'POST',
        body: JSON.stringify({
          selfContribution: '',
          projectReviewComment: '',
          answers: [{ kind: 'REFLECTION', comment: '' }],
          submit: false,
        }),
      },
    );

    expect(presentation.status).toBe(200);
    await expect(presentation.json()).resolves.toMatchObject({
      rateeTeamId: 'team-01',
      status: 'DRAFT',
    });
    expect(peer.status).toBe(403);
  });

  it('발표 수업 시작 전에는 발표 자료 조회만 허용하고 평가 제출은 거부한다', async () => {
    setEvaluationWindowStates('UPCOMING', 'OPEN');

    const overview = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    const submission = await request(
      ENDPOINTS.EVALUATION.TEAM_EVALUATIONS(presentationEvaluationMilestoneId),
      {
        method: 'POST',
        body: JSON.stringify({
          rateeTeamId: 'team-01',
          scores: presentationScores,
          submit: true,
        }),
      },
    );

    expect(overview.status).toBe(200);
    await expect(overview.json()).resolves.toMatchObject({
      windowState: 'UPCOMING',
      teams: expect.arrayContaining([
        expect.objectContaining({ id: 'team-01' }),
      ]),
    });
    expect(submission.status).toBe(403);
    await expect(submission.json()).resolves.toMatchObject({
      code: 'EVALUATION_NOT_OPEN',
    });
  });

  it('상호평가와 개인보고서를 함께 저장하고 다른 학생에게 노출하지 않는다', async () => {
    const input: SubmitPeerEvaluationResponseInput = {
      selfContribution: '문서와 화면 구현을 맡았습니다.',
      projectReviewComment: '협업 흐름이 좋았지만 일정 관리가 아쉬웠습니다.',
      answers: [
        ...contributionAnswers(),
        {
          kind: 'REFLECTION',
          comment: '함께 끝까지 구현한 팀원들을 칭찬합니다.',
        },
      ],
      submit: true,
    };

    const submitResponse = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      { method: 'POST', body: JSON.stringify(input) },
    );
    expect(submitResponse.status).toBe(200);
    await expect(submitResponse.json()).resolves.toMatchObject({
      selfContribution: input.selfContribution,
      projectReviewComment: input.projectReviewComment,
      status: 'SUBMITTED',
    });

    const mine = await request(
      ENDPOINTS.EVALUATION.PEER_TARGETS(peerEvaluationFormId),
    );
    await expect(mine.json()).resolves.toMatchObject({
      myResponse: { status: 'SUBMITTED' },
    });

    const anotherStudent = await request(
      ENDPOINTS.EVALUATION.PEER_TARGETS(peerEvaluationFormId),
      {},
      demoPartnerAccessToken,
    );
    const anotherBody = await anotherStudent.json();
    expect(anotherBody.myResponse).toBeUndefined();
  });

  it('상호평가 임시 저장과 제출 뒤 대시보드 재조회에 섹션과 CTA 상태를 반영한다', async () => {
    const draftInput: SubmitPeerEvaluationResponseInput = {
      selfContribution: '문서 구조를 맡았습니다.',
      projectReviewComment: '',
      answers: [
        ...['20260003', '20260004', '20260005'].map(targetUserId => ({
          kind: 'TEAMMATE_CONTRIBUTION' as const,
          targetUserId,
          contributionPercent: 0,
          contributionDetail: '',
          teammateAssessment: '',
        })),
        { kind: 'REFLECTION', comment: '' },
      ],
      submit: false,
    };
    const draft = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      { method: 'POST', body: JSON.stringify(draftInput) },
    );
    expect(draft.status).toBe(200);

    const draftDashboard = await getDashboardPreview('peer-evaluation');
    const draftMilestone = draftDashboard.milestones.find(
      milestone => milestone.id === 'peer-evaluation',
    );
    expect(draftMilestone?.rows[0]).toMatchObject({
      value: '작성 중',
      actionLabel: '이어 작성',
    });
    expect(draftMilestone?.body).toMatchObject({
      kind: 'peer-evaluation',
      sections: [
        expect.objectContaining({
          id: 'project-evaluation',
          status: 'in-progress',
        }),
        expect.objectContaining({
          id: 'teammate-contribution',
          status: 'not-started',
        }),
      ],
    });

    const submittedInput: SubmitPeerEvaluationResponseInput = {
      selfContribution: '문서와 화면 구현을 맡았습니다.',
      projectReviewComment: '협업 흐름이 좋았습니다.',
      answers: [
        ...contributionAnswers(),
        { kind: 'REFLECTION', comment: '팀원들과 끝까지 협업했습니다.' },
      ],
      submit: true,
    };
    const submit = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      { method: 'POST', body: JSON.stringify(submittedInput) },
    );
    expect(submit.status).toBe(200);

    const submittedDashboard = await getDashboardPreview('peer-evaluation');
    const submittedMilestone = submittedDashboard.milestones.find(
      milestone => milestone.id === 'peer-evaluation',
    );
    expect(submittedMilestone?.rows[0]).toMatchObject({
      value: '제출 완료',
      actionLabel: '제출 내역 보기',
      actionDisabled: false,
    });
    expect(submittedMilestone?.body).toMatchObject({
      kind: 'peer-evaluation',
      sections: [
        expect.objectContaining({ status: 'completed' }),
        expect.objectContaining({ status: 'completed' }),
      ],
    });
  });
});
