import { submitProjectImage } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

/**
 * Uploads one screen image and returns the stored file ID for the draft.
 * The team image endpoint is shared: the mid report stores the same file IDs.
 */
export function useSubmitProjectImageMutation(teamId: string) {
  return useMutation({
    retry: false,
    mutationFn: (file: File) => submitProjectImage(teamId, file),
  });
}
