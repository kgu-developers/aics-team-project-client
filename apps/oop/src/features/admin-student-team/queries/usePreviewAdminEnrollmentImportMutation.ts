import { previewAdminEnrollmentImport } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  sectionId: string;
  file: File;
};

export function usePreviewAdminEnrollmentImportMutation() {
  return useMutation({
    mutationFn: ({ sectionId, file }: Variables) =>
      previewAdminEnrollmentImport(sectionId, file),
  });
}
