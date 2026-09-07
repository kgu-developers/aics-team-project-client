import { fetchAdminPreSurveyResponsesExcelDownload } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

export function useAdminPreSurveyResponsesExcelDownloadMutation() {
  return useMutation({
    mutationFn: fetchAdminPreSurveyResponsesExcelDownload,
  });
}
