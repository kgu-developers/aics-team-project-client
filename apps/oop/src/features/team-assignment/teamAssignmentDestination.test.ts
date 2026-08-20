import { describe, expect, it } from 'vitest';

import { getTeamAssignmentDestination } from './teamAssignmentDestination';

describe('getTeamAssignmentDestination', () => {
  it.each([
    ['survey', '/onboarding/team/survey'],
    ['resultWaiting', '/onboarding/team/survey'],
    ['result', '/onboarding/team/result'],
    ['firstMeeting', '/onboarding/team/first-meeting'],
    ['completed', '/student'],
  ] as const)(
    '%s phase는 허용된 온보딩 목적지로 이동한다',
    (phase, destination) => {
      expect(getTeamAssignmentDestination(phase)).toBe(destination);
    },
  );
});
