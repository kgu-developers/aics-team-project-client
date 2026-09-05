import type { SubmissionArtifactRule, SubmissionLinkRule } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  validateSubmissionFiles,
  validateSubmissionLinks,
} from './validateSubmissionFiles';

const rule: SubmissionArtifactRule = {
  key: 'PRESENTATION_PDF',
  label: '발표 자료 PDF',
  required: true,
  allowedExtensions: ['pdf'],
  maxSize: 20 * 1024 * 1024,
};

describe('validateSubmissionFiles', () => {
  it('대소문자와 관계없이 허용 확장자를 검사한다', () => {
    const file = new File(['slides'], 'presentation.PDF', {
      type: 'application/pdf',
    });

    expect(
      validateSubmissionFiles([rule], { PRESENTATION_PDF: file }),
    ).toBeNull();
  });

  it('필수 파일 누락과 허용하지 않은 확장자를 설명한다', () => {
    expect(validateSubmissionFiles([rule], {})).toBe(
      '발표 자료 PDF 파일을 선택해 주세요.',
    );
    expect(
      validateSubmissionFiles([rule], {
        PRESENTATION_PDF: new File(['text'], 'notes.txt'),
      }),
    ).toContain('.pdf 형식만');
  });
});

describe('validateSubmissionLinks', () => {
  const linkRule: SubmissionLinkRule = {
    key: 'PRESENTATION_DEMO_URL',
    label: '시연 URL',
    required: true,
    allowedProtocols: ['http:', 'https:'],
  };

  it('시연 URL은 HTTP(S) 주소만 허용한다', () => {
    expect(
      validateSubmissionLinks([linkRule], {
        PRESENTATION_DEMO_URL: 'https://example.com/demo',
      }),
    ).toBeNull();
    expect(
      validateSubmissionLinks([linkRule], {
        PRESENTATION_DEMO_URL: 'ftp://example.com/demo',
      }),
    ).toContain('http:, https: 주소만');
    expect(validateSubmissionLinks([linkRule], {})).toBe(
      '시연 URL을(를) 입력해 주세요.',
    );
  });
});
