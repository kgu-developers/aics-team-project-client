import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type {
  StudentSubmissionMemberConsent,
  StudentSubmissionResponse,
} from '@aics/core';
import { http, HttpResponse } from 'msw';

import { getMockAccessToken } from '../authSession';
import { studentSubmissionConsent } from '../data/studentSubmissionConsent';
import { getDemoUserAccount } from '../data/users';

/** Isolated confirmation scenarios for API and component regression tests. */
export function createStudentSubmissionConsentHandlers({
  getSubmission = () => studentSubmissionConsent,
  getActiveStudentNumbers = () => ['20260001', '20260003'],
  milestoneType = 'FINAL_REPORT',
  leaderStudentNumber = '20260001',
  initialConfirmations = {},
}: {
  getSubmission?: () => StudentSubmissionResponse;
  getActiveStudentNumbers?: () => readonly string[];
  milestoneType?: string;
  leaderStudentNumber?: string;
  initialConfirmations?: Readonly<Record<string, number>>;
} = {}) {
  let completed = false;
  const confirmations = new Map(Object.entries(initialConfirmations));
  let observedVersion: number | undefined;
  const error = (code: string, status: number) =>
    HttpResponse.json({ code }, { status });

  function readSubmission() {
    const submission = getSubmission();
    if (submission.currentVersion !== observedVersion) {
      observedVersion = submission.currentVersion;
      // The real FINAL_REPORT submitVersion facade confirms the submitting leader.
      if (milestoneType === 'FINAL_REPORT' && observedVersion > 0)
        confirmations.set(leaderStudentNumber, observedVersion);
    }
    return completed
      ? { ...submission, status: 'COMPLETED' as const, canSubmitNow: false }
      : submission;
  }
  function summary(
    submission: StudentSubmissionResponse,
    studentNumber: string,
  ): StudentSubmissionMemberConsent {
    const active = getActiveStudentNumbers();
    return {
      confirmedCount: active.filter(
        id => confirmations.get(id) === submission.currentVersion,
      ).length,
      totalCount: active.length,
      isConfirmedByMe:
        confirmations.get(studentNumber) === submission.currentVersion,
    };
  }
  function authorize(request: Request, submissionId: unknown) {
    const account = getDemoUserAccount(getMockAccessToken(request));
    if (!account) return error('UNAUTHORIZED', 401);
    const submission = readSubmission();
    if (String(submissionId) !== String(submission.id))
      return error('SUBMISSION_NOT_FOUND', 404);
    if (
      account.user.globalRole !== 'STUDENT' ||
      !getActiveStudentNumbers().includes(account.user.studentNumber)
    )
      return error('ACCESS_DENIED', 403);
    return { submission, studentNumber: account.user.studentNumber };
  }
  function consentHandler(
    request: Request,
    submissionId: unknown,
    action?: 'confirm' | 'cancel',
  ) {
    const authorized = authorize(request, submissionId);
    if (authorized instanceof Response) return authorized;
    if (milestoneType !== 'FINAL_REPORT')
      return error('SUBMISSION_MEMBER_CONFIRMATION_NOT_APPLICABLE', 400);
    const { submission, studentNumber } = authorized;
    // The server has no request version/body and does not reject version 0 here.
    if (action === 'confirm')
      confirmations.set(studentNumber, submission.currentVersion);
    if (action === 'cancel') confirmations.delete(studentNumber);
    return HttpResponse.json(summary(submission, studentNumber));
  }
  return [
    http.patch(
      `${API_BASE_URL}/submissions/:submissionId/complete`,
      ({ request, params }) => {
        const authorized = authorize(request, params.submissionId);
        if (authorized instanceof Response) return authorized;
        if (authorized.studentNumber !== leaderStudentNumber)
          return error('SUBMISSION_LEADER_ONLY', 403);
        if (authorized.submission.status !== 'SUBMITTED')
          return error('SUBMISSION_NOT_YET_SUBMITTED', 400);
        const consent = summary(
          authorized.submission,
          authorized.studentNumber,
        );
        if (consent.confirmedCount !== consent.totalCount)
          return error('SUBMISSION_MEMBER_CONFIRMATION_INCOMPLETE', 428);
        completed = true;
        return HttpResponse.json({
          ...readSubmission(),
          memberConsent: consent,
        });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(':submissionId')}`,
      ({ request, params }) => {
        const authorized = authorize(request, params.submissionId);
        if (authorized instanceof Response) return authorized;
        return HttpResponse.json({
          ...authorized.submission,
          memberConsent:
            milestoneType === 'FINAL_REPORT'
              ? summary(authorized.submission, authorized.studentNumber)
              : null,
        });
      },
    ),
    http.get(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MEMBER_CONFIRMATIONS(':submissionId')}`,
      ({ request, params }) => consentHandler(request, params.submissionId),
    ),
    http.put(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(':submissionId')}`,
      ({ request, params }) =>
        consentHandler(request, params.submissionId, 'confirm'),
    ),
    http.delete(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_MEMBER_CONFIRMATION(':submissionId')}`,
      ({ request, params }) =>
        consentHandler(request, params.submissionId, 'cancel'),
    ),
  ];
}
