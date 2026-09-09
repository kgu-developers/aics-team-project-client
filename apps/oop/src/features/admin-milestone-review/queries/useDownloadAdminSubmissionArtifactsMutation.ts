import { downloadAdminSubmissionArtifacts } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

function saveDownload(file: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(file);
  const anchor = document.createElement('a');

  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

export function useDownloadAdminSubmissionArtifactsMutation() {
  return useMutation({
    mutationFn: downloadAdminSubmissionArtifacts,
    onSuccess: ({ file, fileName }) => {
      saveDownload(file, fileName);
    },
  });
}
