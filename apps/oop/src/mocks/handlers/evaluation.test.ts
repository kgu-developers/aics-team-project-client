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

const evaluationTeamNumericId = 7;
const otherTeamNumericId = 1;
const teamEvaluationScores = [
  { criterionId: 1, score: 5 },
  { criterionId: 2, score: 4 },
  { criterionId: 3, score: 3 },
];

function putTeamEvaluation(
  teamId: number,
  scores: { criterionId: number; score: number }[],
  token = demoAccessToken,
) {
  return request(
    ENDPOINTS.EVALUATION.TEAM_EVALUATION(
      presentationEvaluationMilestoneId,
      String(teamId),
    ),
    { method: 'PUT', body: JSON.stringify({ scores }) },
    token,
  );
}

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
  it('빈 초안과 null 기여도를 저장하고 숫자 ID 및 null 미응답을 반환한다', async () => {
    const path = ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId);
    const empty = await request(path, {
      method: 'POST',
      body: JSON.stringify({
        selfContribution: '',
        projectReviewComment: '',
        answers: [],
        submit: false,
      }),
    });
    expect(empty.status).toBe(200);
    const draft = await request(path, {
      method: 'POST',
      body: JSON.stringify({
        selfContribution: '',
        projectReviewComment: '',
        answers: [{ ...contributionAnswers()[0], contributionPercent: null }],
        submit: false,
      }),
    });
    expect(draft.status).toBe(200);
    const saved = await draft.json();
    expect(saved.id).toEqual(expect.any(Number));
    expect(saved.submittedAt).toBeNull();
    const restored = await request(
      ENDPOINTS.EVALUATION.PEER_TARGETS(peerEvaluationFormId),
    );
    expect(await restored.json()).toMatchObject({
      formId: 2026,
      myResponse: { answers: [{ contributionPercent: null }] },
    });
  });

  it.each(['target', 'duplicate', 'missing', 'null', 'length', 'reflection'])(
    '최종 제출의 %s 위반을 422로 거절한다',
    async scenario => {
      const answers = contributionAnswers();
      if (scenario === 'target')
        answers[0]!.targetUserId = demoStudent.studentNumber;
      if (scenario === 'duplicate')
        answers[1]!.targetUserId = answers[0]!.targetUserId;
      if (scenario === 'missing') {
        answers.splice(1);
        answers[0]!.contributionPercent = 100;
      }
      const input = {
        selfContribution: scenario === 'length' ? 'a'.repeat(2001) : '역할',
        projectReviewComment: '평가',
        answers: [
          ...answers.map(answer => ({
            ...answer,
            contributionPercent:
              scenario === 'null' ? null : answer.contributionPercent,
          })),
          ...(scenario === 'reflection'
            ? []
            : [{ kind: 'REFLECTION', comment: '소감' }]),
        ],
        submit: true,
      };
      const response = await request(
        ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
        { method: 'POST', body: JSON.stringify(input) },
      );
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({
        code: 'INVALID_PEER_EVALUATION_RESPONSE',
      });
    },
  );

  it('제출 완료 후 재제출과 초안 수정을 409로 거절한다', async () => {
    const path = ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId);
    const input = {
      selfContribution: '역할',
      projectReviewComment: '평가',
      answers: [
        ...contributionAnswers(),
        { kind: 'REFLECTION', comment: '소감' },
      ],
      submit: true,
    };
    expect(
      (await request(path, { method: 'POST', body: JSON.stringify(input) }))
        .status,
    ).toBe(200);
    for (const submit of [true, false]) {
      const response = await request(path, {
        method: 'POST',
        body: JSON.stringify({ ...input, submit }),
      });
      expect(response.status).toBe(409);
      expect(await response.json()).toMatchObject({
        code: 'PEER_EVALUATION_ALREADY_SUBMITTED',
      });
    }
  });

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

  it('발표 마일스톤의 팀 목록과 제출 자료를 반환한다', async () => {
    const response = await request(
      ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(
        presentationEvaluationMilestoneId,
      ),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.contents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          teamId: evaluationTeamNumericId,
          presentationOrder: 1,
        }),
        expect.objectContaining({
          teamId: otherTeamNumericId,
          presentationOrder: 2,
        }),
      ]),
    );
    expect(body.contents[0].artifacts[0]).toMatchObject({
      type: 'FILE',
      mimeType: 'application/pdf',
    });
  });

  it('내 평가 조회로 평가 기준과 평가 기간 상태를 제공한다', async () => {
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
      evaluations: [],
    });
    expect(body.criteria).toHaveLength(3);
    expect(body.criteria[0]).toMatchObject({ id: 1, maxScore: 5 });
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
    const response = await putTeamEvaluation(
      evaluationTeamNumericId,
      teamEvaluationScores,
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: 'OWN_TEAM_NOT_ALLOWED',
    });
  });

  it('일부 항목만 담긴 평가 제출을 거절한다', async () => {
    const response = await putTeamEvaluation(otherTeamNumericId, [
      { criterionId: 1, score: 5 },
    ]);

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_SCORE',
    });
  });

  it('발표 평가 제출 뒤에는 로그인한 학생의 내역만 반환한다', async () => {
    const submitResponse = await putTeamEvaluation(
      otherTeamNumericId,
      teamEvaluationScores,
    );
    expect(submitResponse.status).toBe(200);
    await expect(submitResponse.json()).resolves.toMatchObject({
      teamId: otherTeamNumericId,
      scores: teamEvaluationScores,
    });

    const mine = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    await expect(mine.json()).resolves.toMatchObject({
      evaluations: [
        { teamId: otherTeamNumericId, scores: teamEvaluationScores },
      ],
    });

    const anotherStudent = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
      {},
      demoPartnerAccessToken,
    );
    await expect(anotherStudent.json()).resolves.toMatchObject({
      evaluations: [],
    });
  });

  it('발표 평가 제출 뒤 대시보드 재조회에 진행 상태를 반영한다', async () => {
    const submit = await putTeamEvaluation(
      otherTeamNumericId,
      teamEvaluationScores,
    );
    expect(submit.status).toBe(200);

    const dashboard = await getDashboardPreview('presentation-evaluation');
    const presentation = dashboard.milestones.find(
      milestone => milestone.id === 'presentation',
    );

    expect(presentation).toMatchObject({
      currentStepLabel: '발표 평가',
      status: 'in-progress',
    });
    expect(presentation?.rows[0]).toMatchObject({
      value: '제출 완료 1/2팀',
      actionLabel: '평가 계속',
    });
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
      code: 'INVALID_PEER_EVALUATION_RESPONSE',
    });
  });

  it('상호평가의 잘못된 필드 형식을 계약 오류로 반환한다', async () => {
    const response = await request(
      ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
      {
        method: 'POST',
        body: JSON.stringify({ answers: 'invalid', submit: true }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_REQUEST',
    });
  });

  it('발표 평가 기간이 끝나면 조회만 열어 두고 저장을 막는다', async () => {
    setEvaluationWindowStates('CLOSED', 'CLOSED');

    const overview = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    const presentation = await putTeamEvaluation(
      otherTeamNumericId,
      teamEvaluationScores,
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

    expect(overview.status).toBe(200);
    await expect(overview.json()).resolves.toMatchObject({
      windowState: 'CLOSED',
    });
    expect(presentation.status).toBe(403);
    await expect(presentation.json()).resolves.toMatchObject({
      code: 'EVALUATION_NOT_OPEN',
    });
    expect(peer.status).toBe(403);
  });

  it('발표 수업 시작 전에는 발표 자료 조회만 허용하고 평가 제출은 거부한다', async () => {
    setEvaluationWindowStates('UPCOMING', 'OPEN');

    const presentations = await request(
      ENDPOINTS.SUBMISSION.MILESTONE_PRESENTATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    const overview = await request(
      ENDPOINTS.EVALUATION.MY_TEAM_EVALUATIONS(
        presentationEvaluationMilestoneId,
      ),
    );
    const submission = await putTeamEvaluation(
      otherTeamNumericId,
      teamEvaluationScores,
    );

    expect(presentations.status).toBe(200);
    await expect(presentations.json()).resolves.toMatchObject({
      contents: expect.arrayContaining([
        expect.objectContaining({ teamId: otherTeamNumericId }),
      ]),
    });
    expect(overview.status).toBe(200);
    await expect(overview.json()).resolves.toMatchObject({
      windowState: 'UPCOMING',
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
    expect(anotherBody.myResponse).toBeNull();
  });

  it.each([
    [null, 'in-progress'],
    [0, 'completed'],
  ] as const)(
    '서술을 채운 초안의 기여도 %s를 상태 %s로 표시한다',
    async (contributionPercent, status) => {
      const saved = await request(
        ENDPOINTS.EVALUATION.PEER_RESPONSES(peerEvaluationFormId),
        {
          method: 'POST',
          body: JSON.stringify({
            selfContribution: '',
            projectReviewComment: '',
            submit: false,
            answers: contributionAnswers().map(answer => ({
              ...answer,
              contributionPercent,
            })),
          }),
        },
      );
      expect(saved.status).toBe(200);
      const dashboard = await getDashboardPreview('peer-evaluation');
      const milestone = dashboard.milestones.find(
        item => item.id === 'peer-evaluation',
      );
      expect(milestone?.body).toMatchObject({
        kind: 'peer-evaluation',
        sections: expect.arrayContaining([
          expect.objectContaining({ id: 'teammate-contribution', status }),
        ]),
      });
    },
  );

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
