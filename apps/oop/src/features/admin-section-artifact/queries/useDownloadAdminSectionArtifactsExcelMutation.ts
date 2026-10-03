import {
  downloadAdminSectionArtifactsExcel,
  type AdminSectionArtifactsInput,
} from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

export function useDownloadAdminSectionArtifactsExcelMutation() {
  return useMutation({
    mutationFn: (input: AdminSectionArtifactsInput) =>
      downloadAdminSectionArtifactsExcel(input),
  });
}
