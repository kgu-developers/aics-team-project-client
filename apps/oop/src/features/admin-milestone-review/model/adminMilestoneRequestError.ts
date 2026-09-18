import { isAxiosError } from 'axios';

type ErrorBody = { code?: string; message?: string };

/**
 * Status-based fallbacks follow the deployed admin OpenAPI document for
 * `POST /sections/{sectionId}/milestones`. The server only guarantees a
 * `code` field, so a server `message` is shown when present and the status
 * description is used otherwise.
 */
const statusMessages: Record<number, string> = {
  400: '입력값이 올바르지 않습니다. 제목(100자 이내)·주차·마감 일시를 확인해주세요.',
  401: '로그인이 만료되었습니다. 다시 로그인한 뒤 시도해주세요.',
  403: '관리자 권한이 없거나 담당 분반이 아닙니다.',
  404: '분반 또는 마일스톤을 찾을 수 없습니다.',
  409: '같은 분반에서 해당 주차를 이미 사용 중입니다. 다른 주차를 입력해주세요.',
};

const codeMessages: Record<string, string> = {
  DATA_CONFLICT: statusMessages[409]!,
  MILESTONE_NOT_FOUND: statusMessages[404]!,
  SECTION_NOT_FOUND: statusMessages[404]!,
};

export type AdminMilestoneRequestError = {
  code?: string;
  message: string;
  status?: number;
};

export function toAdminMilestoneRequestError(
  error: unknown,
): AdminMilestoneRequestError {
  if (!isAxiosError<ErrorBody>(error)) {
    return {
      message:
        error instanceof Error && error.message
          ? error.message
          : '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    };
  }

  const status = error.response?.status;
  const code = error.response?.data?.code;
  const serverMessage = error.response?.data?.message?.trim();
  const message =
    serverMessage ||
    (code && codeMessages[code]) ||
    (status !== undefined && statusMessages[status]) ||
    (status === undefined || status >= 500
      ? '서버가 응답하지 않습니다. 잠시 후 다시 시도해주세요.'
      : '요청을 처리하지 못했습니다. 입력값을 확인한 뒤 다시 시도해주세요.');

  return { code, message, status };
}

export function formatAdminMilestoneRequestError({
  code,
  message,
  status,
}: AdminMilestoneRequestError) {
  const detail = [status !== undefined ? `HTTP ${status}` : null, code]
    .filter(Boolean)
    .join(' · ');
  return detail ? `${message} (${detail})` : message;
}
