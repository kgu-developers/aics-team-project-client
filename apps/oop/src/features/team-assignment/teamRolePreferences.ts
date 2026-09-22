import type { TeamRolePreference } from '@aics/core';

export const teamRolePreferenceOptions: Array<{
  label: string;
  value: TeamRolePreference;
}> = [
  { label: '팀장(프로젝트 매니저)', value: 'TEAM_LEADER' },
  { label: '개발', value: 'DEVELOPMENT' },
  { label: '자료수집', value: 'RESEARCH' },
  { label: '디자인', value: 'DESIGN' },
  { label: '문서 작성 및 발표', value: 'DOCUMENTATION_PRESENTATION' },
];

const teamRolePreferenceLabels = new Map(
  teamRolePreferenceOptions.map(option => [option.value, option.label]),
);

export function formatTeamRolePreferences(roles: unknown) {
  if (!Array.isArray(roles)) return '';

  const values = roles.filter(
    (role): role is string => typeof role === 'string',
  );

  return values
    .map(
      role => teamRolePreferenceLabels.get(role as TeamRolePreference) ?? role,
    )
    .join(', ');
}
