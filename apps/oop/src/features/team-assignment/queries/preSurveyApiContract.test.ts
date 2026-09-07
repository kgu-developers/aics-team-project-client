import {
  API_BASE_URL,
  ENDPOINTS,
  fetchMyTeamAssignmentSurvey,
  setApiAccessToken,
  submitTeamAssignmentSurvey,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoOtherSectionAccessToken,
} from '~/mocks/data/users';
import {
  resetTeamAssignmentMockData,
  teamAssignmentHandlers,
  teamAssignmentUserHandlers,
} from '~/mocks/handlers/teamAssignment';

const server = setupServer(
  ...teamAssignmentHandlers,
  ...teamAssignmentUserHandlers,
);
const survey = {
  rolePreferences: ['DEVELOPMENT' as const],
  topicIdea: '팀 일정',
  note: '오후 회의',
};
const mySurveyUrl = `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.MY_SURVEY_RESPONSE}`;
const submitUrl = `${API_BASE_URL}${ENDPOINTS.TEAM_ASSIGNMENT.SUBMIT_SURVEY_RESPONSE(':sectionId')}`;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetTeamAssignmentMockData();
  setApiAccessToken(null);
});
afterAll(() => server.close());

describe('사전 설문 HTTP 계약', () => {
  it('미제출은 404이며 제출한 응답을 조회하고 같은 ID로 갱신한다', async () => {
    setApiAccessToken(demoAccessToken);
    await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toMatchObject({
      response: { status: 404 },
    });
    const first = await submitTeamAssignmentSurvey({ sectionId: 1, survey });
    expect(first).toMatchObject({
      sectionId: 1,
      userId: '20260001',
      preferredRoles: ['DEVELOPMENT'],
      topicOpinion: '팀 일정',
      etcOpinion: '오후 회의',
    });
    await expect(fetchMyTeamAssignmentSurvey(1)).resolves.toEqual(first);
    const updated = await submitTeamAssignmentSurvey({
      sectionId: 1,
      survey: { ...survey, topicIdea: '새 주제' },
    });
    expect(updated.id).toBe(first.id);
    expect(updated.topicOpinion).toBe('새 주제');
    await expect(fetchMyTeamAssignmentSurvey(1)).resolves.toEqual(updated);
  });

  it('다른 사용자와 다른 분반에 응답이 섞이지 않는다', async () => {
    setApiAccessToken(demoAccessToken);
    await submitTeamAssignmentSurvey({ sectionId: 1, survey });
    setApiAccessToken(demoPartnerAccessToken);
    await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toMatchObject({
      response: { status: 404 },
    });
    setApiAccessToken(demoOtherSectionAccessToken);
    await submitTeamAssignmentSurvey({ sectionId: 2, survey });
    await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toMatchObject({
      response: { status: 403 },
    });
    await expect(fetchMyTeamAssignmentSurvey(2)).resolves.toMatchObject({
      sectionId: 2,
      userId: '20260021',
    });
  });

  it('비인증 요청과 수강하지 않는 분반 요청을 거절한다', async () => {
    await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toMatchObject({
      response: { status: 401 },
    });
    await expect(
      submitTeamAssignmentSurvey({ sectionId: 1, survey }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    setApiAccessToken(demoAccessToken);
    await expect(fetchMyTeamAssignmentSurvey(2)).rejects.toMatchObject({
      response: { status: 403 },
    });
    await expect(
      submitTeamAssignmentSurvey({ sectionId: 2, survey }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it.each([
    undefined,
    null,
    0,
    -1,
    1.5,
    Number.NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])('분반 ID %s는 GET/POST 요청 전에 거절한다', async sectionId => {
    const requests = vi.fn(() => HttpResponse.json({}));
    server.use(http.get(mySurveyUrl, requests), http.post(submitUrl, requests));
    await expect(
      fetchMyTeamAssignmentSurvey(sectionId as number),
    ).rejects.toThrow('수강 분반');
    await expect(
      submitTeamAssignmentSurvey({ sectionId: sectionId as number, survey }),
    ).rejects.toThrow('수강 분반');
    expect(requests).not.toHaveBeenCalled();
  });

  it.each([null, 'DEVELOPMENT', { role: 'DEVELOPMENT' }, ['DEVELOPMENT', 1]])(
    '역할 응답 %j는 성공으로 해석하지 않는다',
    async preferredRoles => {
      const response = () =>
        HttpResponse.json({
          id: 1,
          sectionId: 1,
          userId: '20260001',
          submittedAt: '2026-09-06 10:00',
          preferredRoles,
        });
      server.use(
        http.get(mySurveyUrl, response),
        http.post(submitUrl, response),
      );
      await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toThrow(
        '역할 응답 형식',
      );
      await expect(
        submitTeamAssignmentSurvey({ sectionId: 1, survey }),
      ).rejects.toThrow('역할 응답 형식');
    },
  );

  it('역할 없는 제출은 400이며 응답을 저장하지 않는다', async () => {
    setApiAccessToken(demoAccessToken);
    await expect(
      submitTeamAssignmentSurvey({
        sectionId: 1,
        survey: { ...survey, rolePreferences: [] },
      }),
    ).rejects.toMatchObject({ response: { status: 400 } });
    await expect(fetchMyTeamAssignmentSurvey(1)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
