import { isAxiosError } from 'axios';

type PasswordChangeErrorBody = { code?: string };

export function getPasswordChangeErrorMessage(error: unknown): string {
  if (isAxiosError<PasswordChangeErrorBody>(error)) {
    if (!error.response) {
      return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
    }
    if (error.response.status === 400) {
      return '입력한 비밀번호가 변경 조건에 맞는지 확인해 주세요.';
    }
    if (error.response.status === 401) {
      return error.response.data?.code === 'INVALID_CREDENTIALS'
        ? '현재 비밀번호가 올바르지 않습니다.'
        : '로그인 상태를 확인할 수 없어요. 다시 로그인해 주세요.';
    }
    if (error.response.status === 403) {
      return '비밀번호 변경 권한을 확인할 수 없어요. 다시 로그인한 뒤 시도해 주세요.';
    }
  }
  return '비밀번호를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
