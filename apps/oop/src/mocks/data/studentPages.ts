import type { TeamProjectResponse } from '@aics/core';

import { updateMockSectionContactVisibility } from './sections';

const projectKey = 'aics:msw-student-project';
const scenarioKey = 'aics:msw-student-scenario';
const scenarios = [
  'topic',
  'topic-finalized',
  'contacts-closed',
  'contacts-upcoming',
  'contacts-error',
] as const;
type Scenario = (typeof scenarios)[number];

function browserScenario(): Scenario {
  const requested = new URLSearchParams(window.location.search).get(
    'mswStudentScenario',
  );
  if (scenarios.some(value => value === requested)) {
    sessionStorage.setItem(scenarioKey, requested!);
    sessionStorage.removeItem(projectKey);
  }
  const saved = sessionStorage.getItem(scenarioKey);
  return scenarios.find(value => value === saved) ?? 'topic';
}

export function createStudentPageState({
  persist = false,
}: { persist?: boolean } = {}) {
  const scenario = persist ? browserScenario() : 'topic';
  let project: TeamProjectResponse | null =
    scenario === 'topic-finalized'
      ? {
          id: 17,
          teamId: 7,
          title: '캠퍼스 도서 대여 관리',
          description: '도서 대여와 반납 일정을 관리합니다.',
          goal: '',
          proposalCompletedAt: null,
        }
      : null;
  if (persist) {
    updateMockSectionContactVisibility(1, {
      contactVisibleFrom:
        scenario === 'contacts-upcoming'
          ? '2099-01-01T00:00:00+09:00'
          : '2020-01-01T00:00:00+09:00',
      contactVisibleUntil:
        scenario === 'contacts-closed' ? '2020-01-02T00:00:00+09:00' : null,
    });
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(projectKey) ?? 'null',
      ) as TeamProjectResponse | null;
      if (
        saved?.teamId === 7 &&
        saved.id === 17 &&
        typeof saved.title === 'string' &&
        typeof saved.description === 'string'
      )
        project = saved;
    } catch {
      sessionStorage.removeItem(projectKey);
    }
  }
  return {
    scenario,
    get project() {
      return project;
    },
    setProject(value: TeamProjectResponse) {
      project = value;
      if (persist) sessionStorage.setItem(projectKey, JSON.stringify(value));
    },
  };
}
