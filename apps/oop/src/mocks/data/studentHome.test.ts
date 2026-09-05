import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { StudentHomeDashboard } from '@aics/core';
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

import {
  resetEvaluationMockData,
  setEvaluationWindowStates,
} from './evaluation';
import {
  createStudentHomeDashboardPreview,
  milestonePreviewScenarios,
} from './studentHome';
import { resetSubmissionMockData } from './submission';
import { demoAccessToken } from './users';
import {
  resetStudentHomePreviewTransitionState,
  studentHomeHandlers,
} from '../handlers/studentHome';

const server = setupServer(...studentHomeHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetEvaluationMockData();
  resetSubmissionMockData();
  resetStudentHomePreviewTransitionState();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const expectedDetailMilestone = {
  'proposal-topic': 'proposal',
  'proposal-writing': 'proposal',
  'proposal-feedback': 'proposal',
  'proposal-feedback-ready': 'proposal',
  'mid-report': 'mid-review',
  'proposal-feedback-mid-report': 'mid-review',
  'mid-feedback': 'mid-review',
  'mid-feedback-ready': 'mid-review',
  'presentation-material-empty': 'presentation',
  'presentation-material': 'presentation',
  'presentation-evaluation': 'presentation',
  'final-report': 'final-report',
  'peer-evaluation': 'peer-evaluation',
} as const;

async function fetchPresentationEvaluationDashboard() {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD('oop-2026-2-01')}`,
    {
      headers: {
        Authorization: `Bearer ${demoAccessToken}`,
        'X-OOP-Milestone-Preview': 'presentation-evaluation',
      },
    },
  );

  return {
    dashboard: (await response.json()) as StudentHomeDashboard,
    response,
  };
}

async function fetchPreviewDashboard(preview: string) {
  const response = await fetch(
    `${API_BASE_URL}${ENDPOINTS.SECTION.STUDENT_DASHBOARD('oop-2026-2-01')}`,
    {
      headers: {
        Authorization: `Bearer ${demoAccessToken}`,
        'X-OOP-Milestone-Preview': preview,
      },
    },
  );

  return {
    dashboard: (await response.json()) as StudentHomeDashboard,
    response,
  };
}

describe('createStudentHomeDashboardPreview', () => {
  it.each(milestonePreviewScenarios)(
    '%s 시나리오는 해당 상위 단계의 상세를 제공한다',
    scenario => {
      const dashboard = createStudentHomeDashboardPreview(scenario);
      const detailMilestones = dashboard.milestones.filter(
        milestone => milestone.isDetailAvailable,
      );

      expect(detailMilestones).toContainEqual(
        expect.objectContaining({ id: expectedDetailMilestone[scenario] }),
      );
      expect(dashboard.hero.ctaLabel).toBe(
        `${detailMilestones.find(milestone => milestone.id === expectedDetailMilestone[scenario])?.currentStepLabel} 확인`,
      );
      expect(
        detailMilestones.find(
          milestone => milestone.id === expectedDetailMilestone[scenario],
        )?.body,
      ).toBeDefined();
    },
  );

  it('제안서 피드백 반영과 조기 활성화된 중간 단계의 상세를 함께 제공한다', () => {
    const dashboard = createStudentHomeDashboardPreview(
      'proposal-feedback-mid-report',
    );
    const proposal = dashboard.milestones.find(
      milestone => milestone.id === 'proposal',
    );
    const midReview = dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    );

    expect(proposal).toMatchObject({
      isDetailAvailable: true,
      status: 'revision-available',
      statusLabel: '수정 가능',
    });
    expect(proposal?.body).toMatchObject({ kind: 'proposal-feedback' });
    expect(proposal?.rows[0]).toMatchObject({
      label: '제안서 수정',
      value: '피드백 반영 가능',
    });
    expect(midReview).toMatchObject({
      isDetailAvailable: true,
      status: 'in-progress',
    });
    expect(
      dashboard.milestones.filter(milestone => milestone.isDetailAvailable),
    ).toHaveLength(2);
  });

  it('상호평가 상세는 프로젝트 평가와 팀원 기여도 평가만 표시한다', () => {
    const dashboard = createStudentHomeDashboardPreview('peer-evaluation');
    const peerEvaluation = dashboard.milestones.find(
      milestone => milestone.id === 'peer-evaluation',
    );

    expect(peerEvaluation?.body).toEqual({
      kind: 'peer-evaluation',
      sections: [
        expect.objectContaining({ label: '프로젝트 평가' }),
        expect.objectContaining({ label: '팀원 기여도 평가' }),
      ],
    });
  });

  it('중간보고서 상세는 피드백 소유 질문 항목을 학생 작성 영역에서 제외한다', () => {
    const dashboard = createStudentHomeDashboardPreview('mid-report');
    const midReview = dashboard.milestones.find(
      milestone => milestone.id === 'mid-review',
    );

    expect(midReview?.body).toMatchObject({
      kind: 'mid-review',
      sections: [
        expect.objectContaining({ id: 'topic' }),
        expect.objectContaining({ id: 'gui-design' }),
        expect.objectContaining({ id: 'engine-design' }),
        expect.objectContaining({ id: 'project-plan' }),
      ],
    });
    expect(
      midReview?.body?.kind === 'mid-review'
        ? midReview.body.sections.map(section => section.id)
        : [],
    ).not.toContain('mid-check-questions');
  });

  it('MSW는 개발 preview 헤더에 맞는 fixture를 반환한다', async () => {
    const { dashboard, response } =
      await fetchPresentationEvaluationDashboard();

    expect(response.status).toBe(200);
    expect(
      dashboard.milestones.find(milestone => milestone.isDetailAvailable)?.id,
    ).toBe('presentation');
    expect(
      dashboard.milestones.find(milestone => milestone.id === 'presentation'),
    ).toMatchObject({
      currentStepLabel: '발표 평가',
      rows: [expect.objectContaining({ value: '평가 가능' })],
      body: {
        kind: 'presentation-evaluation',
        teams: expect.arrayContaining([
          expect.objectContaining({ id: 'team-07', isMine: true }),
        ]),
      },
    });
  });

  it('발표 제출 전 preview는 모든 필수 자료를 빈 슬롯으로 반환한다', async () => {
    const { dashboard, response } = await fetchPreviewDashboard(
      'presentation-material-empty',
    );
    const body = dashboard.milestones.find(
      milestone => milestone.id === 'presentation',
    )?.body;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      kind: 'presentation-material',
      materials: [
        { label: '시연 URL' },
        { label: '발표 자료 PDF' },
        { label: '실행 소스 ZIP' },
      ],
    });
    expect(
      body?.kind === 'presentation-material'
        ? body.materials.every(material => !material.value)
        : false,
    ).toBe(true);
    expect(
      body?.kind === 'presentation-material' ? body.submission : null,
    ).toBeUndefined();
  });

  it.each([
    ['UPCOMING', '기간 전'],
    ['NOT_CONFIGURED', '일정 미정'],
  ] as const)(
    '발표 평가가 %s 상태이면 홈의 평가 CTA를 잠근다',
    async (windowState, label) => {
      setEvaluationWindowStates(windowState, 'OPEN');
      const { dashboard } = await fetchPresentationEvaluationDashboard();
      const presentation = dashboard.milestones.find(
        milestone => milestone.id === 'presentation',
      );

      expect(presentation).toMatchObject({
        status: 'before-period',
        statusLabel: label,
        rows: [
          expect.objectContaining({
            actionDisabled: true,
            actionLabel: label,
            tone: 'muted',
            value: label,
          }),
        ],
      });
    },
  );

  it('발표 수업 종료 후에도 홈의 평가 CTA를 활성 상태로 유지한다', async () => {
    setEvaluationWindowStates('CLOSED', 'OPEN');
    const { dashboard } = await fetchPresentationEvaluationDashboard();
    const presentation = dashboard.milestones.find(
      milestone => milestone.id === 'presentation',
    );

    expect(presentation).toMatchObject({
      status: 'in-progress',
      statusLabel: '평가 가능',
      rows: [
        expect.objectContaining({
          actionDisabled: false,
          actionLabel: '평가하기',
          value: '평가 가능',
        }),
      ],
    });
  });
});
