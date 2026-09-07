export function teamAssignmentQueryKey(sectionId: string | undefined) {
  return ['team-assignment', sectionId] as const;
}

export function teamAssignmentSurveyQueryKey(sectionId: number | undefined) {
  return ['team-assignment', 'survey', sectionId] as const;
}

export function teamMemberContactsQueryKey(teamId: string | undefined) {
  return ['team-member-contacts', teamId] as const;
}

export function teamKickoffQueryKey(teamId: string | undefined) {
  return ['team-kickoff', teamId] as const;
}
