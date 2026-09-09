import type {
  StudentSubmissionResponse,
  StudentSubmissionVersionResponse,
} from '@aics/core';

export const studentSubmissionScope = {
  submissionId: '31',
  sectionId: '1',
  teamId: '7',
  milestoneId: '11',
  studentNumber: '20260001',
};
export const studentSubmission: StudentSubmissionResponse = {
  id: 31,
  milestoneId: 11,
  teamId: 7,
  status: 'SUBMITTED',
  currentVersion: 2,
  canSubmitNow: true,
  hasPendingReview: false,
};
export const studentSubmissionVersions: StudentSubmissionVersionResponse[] = [
  1, 2,
].map(version => ({
  id: 40 + version,
  version,
  description: `검수용 제출 ${version}`,
  changeNote: version === 2 ? '설명 보완' : null,
  submittedBy: { userId: `2026000${version}`, name: `검수 학생 ${version}` },
  submittedAt: `2026-09-0${version} 12:00`,
  updatedAt: `2026-09-0${version} 12:00`,
  late: false,
  artifacts: [
    {
      type: 'FILE',
      requiredArtifactId: 101,
      fileId: 51 + version,
      fileName: `발표-v${version}.pdf`,
      size: 1024 * version,
      mimeType: 'application/pdf',
      downloadUrl: `https://files.example.test/submissions/${version}.pdf`,
    },
    {
      type: 'LINK',
      requiredArtifactId: 102,
      url: `https://example.test/demo/v${version}`,
    },
  ],
}));
