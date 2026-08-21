import type { SubmissionArtifactRule } from '@aics/core';
import { describe, expect, it } from 'vitest';

import { validateSubmissionFiles } from './validateSubmissionFiles';

const rule: SubmissionArtifactRule = {
  key: 'PRESENTATION_FILE',
  label: '발표 자료',
  required: true,
  allowedExtensions: ['ppt', 'pptx'],
  maxSize: 20 * 1024 * 1024,
};

describe('validateSubmissionFiles', () => {
  it('대소문자와 관계없이 허용 확장자를 검사한다', () => {
    const file = new File(['slides'], 'presentation.PPTX', {
      type: 'application/octet-stream',
    });

    expect(
      validateSubmissionFiles([rule], { PRESENTATION_FILE: file }),
    ).toBeNull();
  });

  it('필수 파일 누락과 허용하지 않은 확장자를 설명한다', () => {
    expect(validateSubmissionFiles([rule], {})).toBe(
      '발표 자료 파일을 선택해 주세요.',
    );
    expect(
      validateSubmissionFiles([rule], {
        PRESENTATION_FILE: new File(['text'], 'notes.txt'),
      }),
    ).toContain('.ppt, .pptx 형식만');
  });
});
