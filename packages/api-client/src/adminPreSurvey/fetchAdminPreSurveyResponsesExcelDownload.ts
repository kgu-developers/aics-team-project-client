import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminPreSurveyResponsesExcelDownload = {
  file: Blob;
  fileName: string;
};

const fallbackFileName = '사전조사-응답.xlsx';

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

export async function fetchAdminPreSurveyResponsesExcelDownload(
  sectionId: string,
): Promise<AdminPreSurveyResponsesExcelDownload> {
  const response = await apiClient.get<ArrayBuffer>(
    ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES_DOWNLOAD(sectionId),
    { responseType: 'arraybuffer' },
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
