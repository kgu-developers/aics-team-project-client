import { previewAdminTeamImport } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

type Variables = {
  sectionId: string;
  file: File;
};

export function usePreviewAdminTeamImportMutation() {
  return useMutation({
    mutationFn: ({ sectionId, file }: Variables) =>
      previewAdminTeamImport(sectionId, file),
  });
}
