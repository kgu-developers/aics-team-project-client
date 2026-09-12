import type {
  RequiredSubmissionArtifact,
  StudentSubmissionVersionInput,
} from '@aics/core';

export function safeSubmissionUrl(value?: string | null) {
  try {
    const url = new URL(value ?? '');
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
export function submissionUploadInput(
  rules: RequiredSubmissionArtifact[],
  files: Record<number, File | null>,
  values: Record<number, string>,
  description: string,
  changeNote: string,
): StudentSubmissionVersionInput {
  if (!description.trim()) throw new Error('제출 설명을 입력해 주세요.');
  const input: StudentSubmissionVersionInput = {
    description: description.trim(),
    changeNote: changeNote.trim() || undefined,
    files: [],
    artifacts: [],
  };
  for (const rule of rules) {
    if (rule.type === 'FILE') {
      const file = files[rule.id];
      if (!file) {
        if (rule.required)
          throw new Error(`${rule.label} 파일을 선택해 주세요.`);
        continue;
      }
      const extension = file.name.includes('.')
        ? file.name.split('.').pop()!.toLowerCase()
        : '';
      if (!file.size)
        throw new Error(`${rule.label}: 빈 파일은 제출할 수 없어요.`);
      if (
        rule.allowedExtensions.length &&
        !rule.allowedExtensions
          .map(item => item.replace(/^\./, '').toLowerCase())
          .includes(extension)
      )
        throw new Error(`${rule.label}: 허용된 파일 형식을 확인해 주세요.`);
      if (
        rule.maxFileSizeMb != null &&
        file.size > rule.maxFileSizeMb * 1024 * 1024
      )
        throw new Error(
          `${rule.label}: 최대 ${rule.maxFileSizeMb}MB까지 제출할 수 있어요.`,
        );
      input.files.push({ requiredArtifactId: rule.id, file });
    } else {
      const value = values[rule.id]?.trim();
      if (!value) {
        if (rule.required)
          throw new Error(`${rule.label} 내용을 입력해 주세요.`);
        continue;
      }
      if (rule.type !== 'TEXT' && !safeSubmissionUrl(value))
        throw new Error(`${rule.label}: http 또는 https 링크를 입력해 주세요.`);
      input.artifacts.push({
        requiredArtifactId: rule.id,
        type: rule.type,
        ...(rule.type === 'TEXT' ? { content: value } : { url: value }),
      });
    }
  }
  return input;
}
