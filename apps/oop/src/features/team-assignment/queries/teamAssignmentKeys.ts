export function teamAssignmentQueryKey(sectionId: string | undefined) {
  return ['team-assignment', sectionId] as const;
}

export function teamAssignmentSurveyQueryKey(sectionId: number | undefined) {
  return ['team-assignment', 'survey', sectionId] as const;
}
