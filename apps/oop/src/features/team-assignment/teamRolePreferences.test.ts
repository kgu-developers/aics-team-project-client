import { describe, expect, it } from 'vitest';

import { formatTeamRolePreferences } from './teamRolePreferences';

describe('formatTeamRolePreferences', () => {
  it('사전 정보 희망 역할 코드를 한국어로 표시한다', () => {
    expect(
      formatTeamRolePreferences([
        'TEAM_LEADER',
        'DEVELOPMENT',
        'RESEARCH',
        'DESIGN',
        'DOCUMENTATION_PRESENTATION',
      ]),
    ).toBe('팀장(프로젝트 매니저), 개발, 자료수집, 디자인, 문서 작성 및 발표');
  });

  it('알 수 없는 서버 값은 숨기지 않고 원문을 유지한다', () => {
    expect(formatTeamRolePreferences(['DEVELOPMENT', 'BACKEND'])).toBe(
      '개발, BACKEND',
    );
    expect(formatTeamRolePreferences(null)).toBe('');
  });
});
