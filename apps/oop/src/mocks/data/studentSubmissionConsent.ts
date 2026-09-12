import type { StudentSubmissionResponse } from '@aics/core';

export const studentSubmissionConsentScope = {
  sectionId: '1',
  teamId: '7',
  milestoneId: '21',
  submissionId: '41',
  studentNumber: '20260003',
  currentVersion: 2,
  milestoneType: 'FINAL_REPORT',
} as const;

export const studentSubmissionConsent: StudentSubmissionResponse = {
  id: 41,
  teamId: 7,
  milestoneId: 21,
  status: 'SUBMITTED',
  currentVersion: 2,
  canSubmitNow: true,
  hasPendingReview: false,
};
