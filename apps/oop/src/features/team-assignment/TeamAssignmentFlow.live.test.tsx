import type {
  CurrentUser,
  PreSurveyResponseDetailResponse,
  SectionResponse,
} from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import TeamAssignmentFlow from './TeamAssignmentFlow';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockCurrentUserQuery = vi.hoisted(() => vi.fn());
const mockSectionsQuery = vi.hoisted(() => vi.fn());
const mockSurveyQuery = vi.hoisted(() => vi.fn());
const mockKickoffQuery = vi.hoisted(() => vi.fn());
const mockProjectionQuery = vi.hoisted(() => vi.fn());

vi.mock('~/shared/config/developmentMode', () => ({
  isMockDevelopmentMode: () => false,
}));

vi.mock('@tanstack/react-router', () => ({
  Navigate: ({ to }: { to: string }) => <p>이동: {to}</p>,
  useNavigate: () => mockNavigate,
}));

vi.mock('~/features/auth/queries', () => ({
  useCurrentUserQuery: mockCurrentUserQuery,
}));

vi.mock('~/features/section/queries', () => ({
  useMySectionsQuery: mockSectionsQuery,
}));

vi.mock('./queries', () => ({
  useConfirmTeamLeaderMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useMyTeamAssignmentSurveyQuery: mockSurveyQuery,
  useSubmitTeamAssignmentSurveyMutation: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
  useTeamAssignmentProjectionQuery: mockProjectionQuery,
  useTeamKickoffQuery: mockKickoffQuery,
  useTeamMemberContactsQuery: () => ({
    data: [],
    isError: false,
    isPending: false,
  }),
}));

const section: SectionResponse = {
  id: 1,
  code: 'CS101',
  name: '01',
  classTime: '월123',
  capacity: 40,
  contactVisibleFrom: '2099-09-10T10:00:00+09:00',
  contactVisibleUntil: '2099-09-11T10:00:00+09:00',
  courseId: 1,
  courseName: '객체지향프로그래밍',
  year: 2099,
  semester: 'FALL',
  status: 'ACTIVE',
};

const student: CurrentUser = {
  id: '20260001',
  studentNumber: '20260001',
  name: '한가온',
  email: 'gaon@example.com',
  globalRole: 'STUDENT',
  sections: [{ id: '1', code: 'CS101', name: '01', role: 'STUDENT' }],
  currentTeam: null,
};

const surveyResponse: PreSurveyResponseDetailResponse = {
  id: 1,
  sectionId: 1,
  userId: student.studentNumber,
  preferredRoles: ['DEVELOPMENT'],
  submittedAt: '2099-09-01 10:00',
};

function queryResult<T>(data?: T, error?: unknown) {
  return {
    data,
    error,
    isError: error !== undefined,
    isPending: false,
    refetch: vi.fn(),
  };
}

function renderFlow() {
  return render(<TeamAssignmentFlow />, { wrapper: AstryxThemeProvider });
}

beforeEach(() => {
  mockNavigate.mockReset();
  mockCurrentUserQuery.mockReset();
  mockSectionsQuery.mockReset();
  mockSurveyQuery.mockReset();
  mockKickoffQuery.mockReset();
  mockProjectionQuery.mockReset();
  useAuthStore.getState().setCurrentUser(student);

  mockCurrentUserQuery.mockReturnValue(queryResult(student));
  mockSectionsQuery.mockReturnValue(queryResult([section]));
  mockKickoffQuery.mockReturnValue(queryResult());
});

afterEach(() => {
  useAuthStore.getState().clearSession();
});

describe('TeamAssignmentFlow live API mode', () => {
  it('사전 설문 응답이 404면 단일 온보딩 URL에서 설문을 표시한다', () => {
    mockSurveyQuery.mockReturnValue(
      queryResult(undefined, {
        isAxiosError: true,
        response: { status: 404 },
      }),
    );

    renderFlow();

    expect(
      screen.getByText('팀프로젝트 팀구성을 위한 설문에 응답해 주세요.'),
    ).toBeVisible();
    expect(mockProjectionQuery).not.toHaveBeenCalled();
  });

  it('설문 응답은 있지만 팀이 없으면 팀 배정 대기를 표시한다', () => {
    mockSurveyQuery.mockReturnValue(queryResult(surveyResponse));

    renderFlow();

    expect(
      screen.getByRole('heading', {
        name: '설문에 응답해 주셔서 감사합니다.',
      }),
    ).toBeVisible();
  });

  it.each([401, 403, 500])(
    '%s 오류는 미제출 설문으로 바꾸지 않는다',
    status => {
      mockSurveyQuery.mockReturnValue(
        queryResult(undefined, { isAxiosError: true, response: { status } }),
      );
      renderFlow();
      expect(
        screen.getByText('사전 설문 제출 상태를 확인하지 못했어요.'),
      ).toBeVisible();
      expect(
        screen.queryByText('팀프로젝트 팀구성을 위한 설문에 응답해 주세요.'),
      ).toBeNull();
    },
  );
  it('기존 사용자 정보가 있어도 사용자 재조회 실패를 복구 화면으로 표시한다', () => {
    mockCurrentUserQuery.mockReturnValue(
      queryResult(student, new Error('session expired')),
    );
    mockSurveyQuery.mockReturnValue(queryResult(surveyResponse));
    renderFlow();
    expect(screen.getByText('로그인 정보를 확인해 주세요.')).toBeVisible();
    expect(mockSurveyQuery).toHaveBeenCalledWith(undefined);
    expect(screen.queryByText('설문에 응답해 주셔서 감사합니다.')).toBeNull();
  });
  it('다중 분반 선택 전에는 설문을 표시하거나 조회하지 않는다', () => {
    mockSectionsQuery.mockReturnValue(
      queryResult([section, { ...section, id: 2, name: '02' }]),
    );
    mockSurveyQuery.mockReturnValue(queryResult());
    renderFlow();
    expect(
      screen.getByText('설문에 응답할 수강 분반을 선택해 주세요.'),
    ).toBeVisible();
    expect(mockSurveyQuery).toHaveBeenCalledWith(undefined);
  });
  it('연결된 분반이 없으면 설문 대신 복구 안내를 표시한다', () => {
    mockSectionsQuery.mockReturnValue(queryResult([]));
    mockSurveyQuery.mockReturnValue(queryResult());
    renderFlow();
    expect(screen.getByText('연결된 수강 분반이 없어요.')).toBeVisible();
    expect(mockSurveyQuery).toHaveBeenCalledWith(undefined);
  });
  it('다중 분반의 팀 소속을 추측하지 않는다', () => {
    mockCurrentUserQuery.mockReturnValue(
      queryResult({
        ...student,
        teamId: '4',
        sections: [...student.sections, { ...student.sections[0], id: '2' }],
      }),
    );
    mockSurveyQuery.mockReturnValue(queryResult());
    renderFlow();
    expect(screen.getByText(/배정된 팀이 어느 수강 분반/)).toBeVisible();
    expect(mockSurveyQuery).toHaveBeenCalledWith(undefined);
  });
});
