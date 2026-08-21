import { isAxiosError } from 'axios';

export function getSubmissionErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      '제출 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'
    );
  }
  return '제출 요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
