import { describe, expect, it } from 'vitest';

import {
  formatRequiredArtifactFileSize,
  MAX_REQUIRED_ARTIFACT_FILE_SIZE_MB,
  requiredArtifactUploadLimitDescription,
} from './requiredArtifactFileSize';

describe('requiredArtifactFileSize', () => {
  it('개별 제한이 없더라도 시스템 파일 상한을 안내한다', () => {
    expect(formatRequiredArtifactFileSize(null)).toBe(
      '개별 제한 없음 · 시스템 상한 100MB',
    );
    expect(requiredArtifactUploadLimitDescription).toContain('100MB');
    expect(requiredArtifactUploadLimitDescription).toContain('110MB');
  });

  it('서버의 파일 한 개 상한을 100MB로 둔다', () => {
    expect(MAX_REQUIRED_ARTIFACT_FILE_SIZE_MB).toBe(100);
    expect(formatRequiredArtifactFileSize(100)).toBe('최대 용량: 100MB');
  });
});
