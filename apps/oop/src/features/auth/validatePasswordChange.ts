type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export type PasswordValidationIssue = {
  field: PasswordField;
  message: string;
} | null;

const MAX_PASSWORD_CHARACTERS = 64;
const MAX_BCRYPT_PASSWORD_BYTES = 72;

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordValidationIssue {
  if (!currentPassword.trim()) {
    return {
      field: 'currentPassword',
      message: '현재 비밀번호를 입력해 주세요.',
    };
  }

  if (!newPassword.trim()) {
    return {
      field: 'newPassword',
      message: '새 비밀번호를 입력해 주세요.',
    };
  }

  if (newPassword.length < 8) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 8자 이상이어야 합니다.',
    };
  }

  if (newPassword.length > MAX_PASSWORD_CHARACTERS) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 64자 이하여야 합니다.',
    };
  }

  if (getUtf8ByteLength(newPassword) > MAX_BCRYPT_PASSWORD_BYTES) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.',
    };
  }

  if (newPassword === currentPassword) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    };
  }

  if (!confirmPassword.trim()) {
    return {
      field: 'confirmPassword',
      message: '새 비밀번호를 한 번 더 입력해 주세요.',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      field: 'confirmPassword',
      message: '새 비밀번호가 일치하지 않습니다.',
    };
  }

  return null;
}
