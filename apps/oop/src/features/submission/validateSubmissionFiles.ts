import type { SubmissionArtifactRule, SubmissionLinkRule } from '@aics/core';

export function formatFileSize(bytes: number) {
  return `${Math.ceil(bytes / (1024 * 1024))}MB`;
}

function getExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function validateSubmissionFiles(
  rules: SubmissionArtifactRule[],
  files: Partial<Record<SubmissionArtifactRule['key'], File | null>>,
) {
  for (const rule of rules) {
    const file = files[rule.key];
    if (!file) return `${rule.label} 파일을 선택해 주세요.`;
    if (!rule.allowedExtensions.includes(getExtension(file.name))) {
      return `${rule.label}은(는) ${rule.allowedExtensions.map(extension => `.${extension}`).join(', ')} 형식만 제출할 수 있어요.`;
    }
    if (file.size > rule.maxSize) {
      return `${rule.label}은(는) ${formatFileSize(rule.maxSize)} 이하여야 해요.`;
    }
  }
  return null;
}

export function validateSubmissionLinks(
  rules: SubmissionLinkRule[],
  values: Partial<Record<SubmissionLinkRule['key'], string>>,
) {
  for (const rule of rules) {
    const value = values[rule.key]?.trim() ?? '';
    if (!value) return `${rule.label}을(를) 입력해 주세요.`;
    try {
      const url = new URL(value);
      if (!rule.allowedProtocols.includes(url.protocol)) {
        return `${rule.label}은(는) ${rule.allowedProtocols.join(', ')} 주소만 입력할 수 있어요.`;
      }
    } catch {
      return `${rule.label} 형식이 올바르지 않아요.`;
    }
  }

  return null;
}
