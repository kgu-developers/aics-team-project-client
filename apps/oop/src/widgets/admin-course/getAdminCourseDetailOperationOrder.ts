export type AdminCourseDetailOperationPanel =
  'artifactSummary' | 'dataUpload' | 'preSurvey';

export function getAdminCourseDetailOperationOrder({
  hasStudentRoster,
  hasTeamRoster,
}: {
  hasStudentRoster: boolean;
  hasTeamRoster: boolean;
}): readonly AdminCourseDetailOperationPanel[] {
  if (!hasStudentRoster) {
    return ['dataUpload', 'preSurvey', 'artifactSummary'];
  }

  if (!hasTeamRoster) {
    return ['preSurvey', 'dataUpload', 'artifactSummary'];
  }

  return ['artifactSummary', 'preSurvey', 'dataUpload'];
}
