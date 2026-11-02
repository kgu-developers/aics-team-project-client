import { isAxiosError } from 'axios';

export type DocumentRequestRecovery =
  'replace-content' | 'recheck-lock' | 'refresh-status' | 'retry';

/** Local preflight failures carry the same recovery intent as API failures. */
export class DocumentRequestError extends Error {
  constructor(
    message: string,
    readonly recovery: DocumentRequestRecovery,
  ) {
    super(message);
  }
}

export function documentRequestRecovery(
  error: unknown,
): DocumentRequestRecovery {
  if (error instanceof DocumentRequestError) return error.recovery;
  if (isAxiosError<{ code?: string }>(error)) {
    switch (error.response?.data?.code) {
      case 'PROJECT_VERSION_CONFLICT':
        return 'replace-content';
      case 'EDIT_LOCK_CONFLICT':
        return 'recheck-lock';
    }
  }
  // An unknown 409, validation failure, or network error cannot justify
  // discarding the user's draft.
  return 'retry';
}

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
    case 'PROJECT_VERSION_CONFLICT':
      return '이 영역에 다른 변경이 저장됐어요. 입력은 유지됩니다. 최신 내용을 확인한 뒤 다시 편집해 주세요.';
    case 'EDIT_LOCK_CONFLICT':
      return '편집 권한을 잃어 저장하지 못했어요. 입력은 유지됩니다. 편집 권한을 다시 확인해 주세요.';
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
