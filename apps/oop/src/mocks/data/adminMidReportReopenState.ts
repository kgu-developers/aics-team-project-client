const storageKey = 'aics.oop.msw.admin-mid-report-reopened-submissions';

type ReopenedSubmission = {
  milestoneId: number;
  teamId: number;
};

function loadReopenedSubmissions() {
  if (typeof localStorage === 'undefined') return [] as ReopenedSubmission[];

  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return [] as ReopenedSubmission[];

    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(
          (value): value is ReopenedSubmission =>
            typeof value === 'object' &&
            value !== null &&
            Number.isSafeInteger(value.milestoneId) &&
            Number.isSafeInteger(value.teamId),
        )
      : [];
  } catch {
    return [] as ReopenedSubmission[];
  }
}

let reopenedSubmissions = loadReopenedSubmissions();

function persistReopenedSubmissions() {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(storageKey, JSON.stringify(reopenedSubmissions));
  } catch {
    // Persistence is only a development convenience for the MSW scenario.
  }
}

export function isAdminMidReportSubmissionReopened(
  milestoneId: number,
  teamId: number,
) {
  return reopenedSubmissions.some(
    submission =>
      submission.milestoneId === milestoneId && submission.teamId === teamId,
  );
}

export function reopenAdminMidReportSubmission(
  milestoneId: number,
  teamId: number,
) {
  if (isAdminMidReportSubmissionReopened(milestoneId, teamId)) return;

  reopenedSubmissions = [...reopenedSubmissions, { milestoneId, teamId }];
  persistReopenedSubmissions();
}

export function resetAdminMidReportReopenState() {
  reopenedSubmissions = [];
  if (typeof localStorage !== 'undefined') localStorage.removeItem(storageKey);
}
