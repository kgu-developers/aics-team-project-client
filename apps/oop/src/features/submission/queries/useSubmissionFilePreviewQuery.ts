import { fetchStudentSubmissionPreview } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

export function useSubmissionFilePreviewQuery(url?: string) {
  return useQuery({
    queryKey: ['student-submission-preview', url],
    queryFn: url
      ? ({ signal }) => fetchStudentSubmissionPreview(url, signal)
      : skipToken,
    retry: false,
    gcTime: 0,
  });
}
