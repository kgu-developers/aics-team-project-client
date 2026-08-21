import type { SubmissionArtifactRule } from '@aics/core';

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
