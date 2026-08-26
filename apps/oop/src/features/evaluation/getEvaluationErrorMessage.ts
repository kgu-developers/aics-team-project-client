import { isAxiosError } from 'axios';

export function getEvaluationErrorMessage(error: unknown) {
  if (!isAxiosError<{ message?: string }>(error))
    return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
  return (
    error.response?.data.message ??
    (error.response?.status === 401
      ? '로그인 상태를 확인해 주세요.'
      : '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.')
  );
}
