import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  StudentSubmissionResponse,
  StudentSubmissionVersionResponse,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import {
  studentSubmission,
  studentSubmissionVersions,
} from '../data/studentSubmissionScenarios';
/** Read-only scenario overrides for tests; browser handlers enforce fixture authentication. */
export function createStudentSubmissionHandlers(
  options: {
    submission?: StudentSubmissionResponse;
    versions?: StudentSubmissionVersionResponse[];
  } = {},
) {
  const submission = structuredClone(options.submission ?? studentSubmission);
  const versions = structuredClone(
    options.versions ?? studentSubmissionVersions,
  );
  let generation = 0;
  const forbidden = () =>
    HttpResponse.json({ code: 'ACCESS_DENIED' }, { status: 403 });
  const withFreshLinks = (version: StudentSubmissionVersionResponse) => ({
    ...version,
    artifacts: version.artifacts.map(artifact => ({
      ...artifact,
      ...(artifact.downloadUrl
        ? { downloadUrl: `${artifact.downloadUrl}?generation=${++generation}` }
        : {}),
    })),
  });
  return [
    http.get(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(':submissionId')}`,
      ({ params }) =>
        String(params.submissionId) === String(submission.id)
          ? HttpResponse.json(submission)
          : forbidden(),
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(':submissionId')}`,
      ({ params }) =>
        String(params.submissionId) === String(submission.id)
          ? HttpResponse.json({ contents: versions.map(withFreshLinks) })
          : forbidden(),
    ),
    http.get(
      `${API_BASE_URL}/submissions/:submissionId/versions/:version`,
      ({ params }) => {
        if (String(params.submissionId) !== String(submission.id))
          return forbidden();
        const version = versions.find(
          item => item.version === Number(params.version),
        );
        return version
          ? HttpResponse.json(withFreshLinks(version))
          : HttpResponse.json({ code: 'VERSION_NOT_FOUND' }, { status: 404 });
      },
    ),
    http.get(
      'https://files.example.test/submissions/:file',
      () =>
        new HttpResponse('%PDF-1.4\n% Synthetic review fixture\n%%EOF', {
          headers: { 'Content-Type': 'application/pdf' },
        }),
    ),
  ];
}
