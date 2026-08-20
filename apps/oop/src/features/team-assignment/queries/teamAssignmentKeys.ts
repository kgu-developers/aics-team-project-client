export function teamAssignmentQueryKey(sectionId: string | undefined) {
  return ['team-assignment', sectionId] as const;
}
