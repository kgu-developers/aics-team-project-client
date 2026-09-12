import { isAxiosError } from 'axios';

/**
 * Shared document request failures: the mapped guidance wins over the raw
 * server text so a bare 500 never reaches the user as English.
 */
export function documentRequestErrorMessage(error: unknown) {
  if (error instanceof Error && !isAxiosError(error)) return error.message;
  if (!isAxiosError<{ code?: string; message?: string }>(error))
    return '요청을 처리하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.';
  const { code, message } = error.response?.data ?? {};
  switch (code) {
    case 'PROPOSAL_SECTION_INCOMPLETE':
      return '작성 완료되지 않은 영역이 있어요. 각 영역을 완료한 뒤 제출해 주세요.';
    case 'PROJECT_PROPOSAL_COMPLETED':
      return '이미 제출된 제안서예요. 최신 내용을 다시 조회해 주세요.';
    case 'ACCESS_DENIED':
      return '이 작업을 수행할 권한이 없어요. 팀장 여부를 확인해 주세요.';
  }
  switch (error.response?.status) {
    case 400:
      return '입력하지 않은 필수 항목이 있어요. 제목·설명·목표와 각 영역 입력을 확인해 주세요.';
    case 401:
      return '로그인 상태를 확인한 뒤 다시 시도해 주세요.';
    case 403:
      return '이 작업을 수행할 권한이 없어요. 팀장 여부를 확인해 주세요.';
    case 409:
      return '다른 변경이 먼저 저장됐어요. 최신 내용을 확인한 뒤 다시 시도해 주세요.';
    case 500:
      return '서버가 요청을 처리하지 못했어요. 빈 입력이 없는지 확인한 뒤 다시 시도해 주세요.';
  }
  // The raw server text is the last resort, after the mapped guidance.
  if (message) return message;
  return '요청을 처리하지 못했어요. 입력 내용을 유지한 채 다시 시도해 주세요.';
}
