export const MAX_REQUIRED_ARTIFACT_FILE_SIZE_MB = 100;

export const requiredArtifactUploadLimitDescription =
  '파일 1개당 최대 100MB이며, 여러 파일을 한 번에 제출하면 전체 용량은 110MB 이하여야 합니다.';

export function formatRequiredArtifactFileSize(maxFileSizeMb?: number | null) {
  return maxFileSizeMb == null
    ? '개별 제한 없음 · 시스템 상한 100MB'
    : `최대 용량: ${maxFileSizeMb}MB`;
}
