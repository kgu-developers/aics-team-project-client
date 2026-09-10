import type {
  StudentMilestoneResponse,
  StudentSubmissionResponse,
  StudentSubmissionVersionResponse,
} from '@aics/core';

const uploadedSubmissions = new Map<number, StudentSubmissionResponse>();
const uploadedVersions = new Map<number, StudentSubmissionVersionResponse[]>();
export function storeStudentSubmission(
  submission: StudentSubmissionResponse,
  versions: StudentSubmissionVersionResponse[],
) {
  uploadedSubmissions.set(submission.id, submission);
  uploadedVersions.set(submission.id, versions);
}
export function resetStudentSubmissionUploads() {
  uploadedSubmissions.clear();
  uploadedVersions.clear();
}

/** Synthetic read fixtures shared by the home summary and submission details. */
export function studentSubmissionFixture(
  milestone: StudentMilestoneResponse,
  teamId: number,
): StudentSubmissionResponse {
  const stored = uploadedSubmissions.get(teamId * 100000 + milestone.id);
  if (stored) return stored;
  const currentVersion =
    milestone.type === 'PRESENTATION'
      ? 2
      : milestone.type === 'FINAL_REPORT'
        ? 1
        : 0;
  return {
    id: teamId * 100000 + milestone.id,
    milestoneId: milestone.id,
    teamId,
    status: currentVersion ? 'SUBMITTED' : 'NOT_SUBMITTED',
    currentVersion,
    canSubmitNow: true,
    hasPendingReview: false,
  };
}

export function studentSubmissionVersionFixtures(
  submission: StudentSubmissionResponse,
): StudentSubmissionVersionResponse[] {
  const stored = uploadedVersions.get(submission.id);
  if (stored) return stored;
  return Array.from({ length: submission.currentVersion }, (_, index) => {
    const version = index + 1;
    return {
      id: submission.id * 10 + version,
      version,
      description: `팀 프로젝트 제출 자료 ${version}`,
      changeNote: version > 1 ? '발표 설명 보완' : null,
      submittedBy:
        version === 1
          ? { userId: '20260001', name: 'OOP 데모 학생 A' }
          : { userId: '20260003', name: 'OOP 데모 학생 B' },
      submittedAt: `2026-09-0${version}T12:00:00`,
      updatedAt: `2026-09-0${version}T12:00:00`,
      late: false,
      artifacts: [
        {
          type: 'FILE',
          requiredArtifactId: 101,
          fileId: submission.id * 10 + version,
          fileName: `제출자료-v${version}.pdf`,
          size: 1024 * version,
          mimeType: 'application/pdf',
          downloadUrl: `https://files.example.test/submissions/${submission.id}-${version}.pdf`,
        },
      ],
    };
  });
}

/** Small, valid PDF for browser preview without using real student files. */
export function submissionPreviewPdf() {
  const stream =
    'BT /F1 18 Tf 40 140 Td (Team project - demo submission) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const start = pdf.length;
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return pdf;
}
