import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSubmissionArtifactsDownload = {
  fileName: string;
  file: Blob;
};

function getDownloadFileName(
  contentDisposition: string | undefined,
  submissionId: string,
) {
  const encodedMatch = contentDisposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) return decodeURIComponent(encodedMatch[1]);

  const plainMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? `submission-${submissionId}.zip`;
}

export async function downloadAdminSubmissionArtifacts(
  submissionId: string,
): Promise<AdminSubmissionArtifactsDownload> {
  const response = await apiClient.get<Blob>(
    ENDPOINTS.ADMIN.SUBMISSION_DOWNLOAD(submissionId),
    { responseType: 'blob' },
  );

  return {
    file: response.data,
    fileName: getDownloadFileName(
      typeof response.headers['content-disposition'] === 'string'
        ? response.headers['content-disposition']
        : undefined,
      submissionId,
    ),
  };
}
