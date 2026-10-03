import type {
  AdminSectionArtifactsExcelDownload,
  AdminSectionArtifactsInput,
} from './types';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

const fallbackFileName = '분반-산출물.xlsx';

function getFileName(contentDisposition: string | undefined) {
  if (!contentDisposition) return fallbackFileName;

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return fallbackFileName;
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1] ?? fallbackFileName;
}

export async function downloadAdminSectionArtifactsExcel({
  asOf,
  sectionId,
}: AdminSectionArtifactsInput): Promise<AdminSectionArtifactsExcelDownload> {
  const response = await apiClient.get<ArrayBuffer>(
    ENDPOINTS.ADMIN.SECTION_ARTIFACT_DOWNLOAD(sectionId),
    {
      params: { asOf },
      responseType: 'arraybuffer',
    },
  );
  const contentType = response.headers['content-type'];
  const contentDisposition = response.headers['content-disposition'];

  return {
    file: new Blob([response.data], {
      type:
        (typeof contentType === 'string' ? contentType : undefined) ??
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    fileName: getFileName(
      typeof contentDisposition === 'string' ? contentDisposition : undefined,
    ),
  };
}
