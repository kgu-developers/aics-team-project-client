import { downloadAdminSubmissionArtifacts } from '@aics/api-client';
import { useToast } from '@aics/design-system';
import { useMutation } from '@tanstack/react-query';

import { saveDownload } from '~/shared/lib/saveDownload';

export function useDownloadAdminSubmissionArtifactsMutation() {
  const toast = useToast();
  return useMutation({
    mutationFn: downloadAdminSubmissionArtifacts,
    onError: () =>
      toast({
        body: '제출 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
      }),
    onSuccess: ({ file, fileName }) => {
      saveDownload(file, fileName);
    },
  });
}
