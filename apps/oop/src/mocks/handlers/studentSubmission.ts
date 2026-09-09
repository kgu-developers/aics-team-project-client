import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getMockMySections } from '../data/sections';
import { studentMilestoneFixtures } from '../data/studentMilestones';
import {
  studentSubmissionFixture,
  studentSubmissionVersionFixtures,
  submissionPreviewPdf,
} from '../data/studentSubmission';

function ownSubmission(request: Request, submissionId: string) {
  const account = getMockAuthenticatedAccount(request);
  if (!account) return new HttpResponse(null, { status: 401 });
  if (account.user.globalRole !== 'STUDENT')
    return new HttpResponse(null, { status: 403 });
  const teamId = Number(account.user.currentTeam?.id.replace(/^team-/, ''));
  const sections = getMockMySections(account.credentials.studentNumber, {
    status: 'ACTIVE',
  });
  const submission = sections
    .flatMap(section => studentMilestoneFixtures(section.id))
    .map(milestone => studentSubmissionFixture(milestone, teamId))
    .find(item => String(item.id) === submissionId);
  return submission ?? new HttpResponse(null, { status: 403 });
}
let generation = 0;
function freshVersions(
  submission: Exclude<ReturnType<typeof ownSubmission>, Response>,
) {
  return studentSubmissionVersionFixtures(submission).map(version => ({
    ...version,
    artifacts: version.artifacts.map(artifact => ({
      ...artifact,
      downloadUrl: `${artifact.downloadUrl}?generation=${++generation}`,
    })),
  }));
}

export const studentSubmissionHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(':submissionId')}`,
    ({ request, params }) => {
      // Legacy demo editor paths have string IDs and keep their existing handlers.
      if (!/^\d+$/.test(String(params.submissionId))) return;
      const submission = ownSubmission(request, String(params.submissionId));
      return submission instanceof Response
        ? submission
        : HttpResponse.json(submission);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
    ({ request, params }) => {
      if (!/^\d+$/.test(String(params.submissionId))) return;
      const submission = ownSubmission(request, String(params.submissionId));
      return submission instanceof Response
        ? submission
        : HttpResponse.json({ contents: freshVersions(submission) });
    },
  ),
  http.get(
    `${API_BASE_URL}/submissions/:submissionId/versions/:version`,
    ({ request, params }) => {
      const submission = ownSubmission(request, String(params.submissionId));
      if (submission instanceof Response) return submission;
      const number = Number(params.version);
      if (!Number.isSafeInteger(number) || number <= 0)
        return new HttpResponse(null, { status: 400 });
      const version = freshVersions(submission).find(
        item => item.version === number,
      );
      return version
        ? HttpResponse.json(version)
        : new HttpResponse(null, { status: 404 });
    },
  ),
  http.get(
    'https://files.example.test/submissions/:file',
    () =>
      new HttpResponse(submissionPreviewPdf(), {
        headers: { 'Content-Type': 'application/pdf' },
      }),
  ),
];
