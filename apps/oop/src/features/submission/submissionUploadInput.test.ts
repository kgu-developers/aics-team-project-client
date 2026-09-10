import type { RequiredSubmissionArtifact } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  safeSubmissionUrl,
  submissionUploadInput,
} from './submissionUploadInput';
const rule: RequiredSubmissionArtifact = {
  id: 1,
  type: 'FILE',
  label: '보고서',
  required: true,
  allowedExtensions: ['pdf'],
  maxFileSizeMb: 1,
};
describe('파일 제출 입력 검증', () => {
  it('필수파일 누락과 빈파일·형식·크기 오류를 구분한다', () => {
    expect(() => submissionUploadInput([rule], {}, {}, '설명', '')).toThrow(
      '선택',
    );
    expect(() =>
      submissionUploadInput(
        [rule],
        { 1: new File([], 'report.pdf') },
        {},
        '설명',
        '',
      ),
    ).toThrow('빈 파일');
    expect(() =>
      submissionUploadInput(
        [rule],
        { 1: new File(['x'], 'report.exe') },
        {},
        '설명',
        '',
      ),
    ).toThrow('형식');
    expect(() =>
      submissionUploadInput(
        [rule],
        { 1: new File([new Uint8Array(1048577)], 'report.pdf') },
        {},
        '설명',
        '',
      ),
    ).toThrow('최대 1MB');
  });
  it('선택 항목은 생략하고 최대 크기와 대문자 확장자를 허용한다', () => {
    const optional = { ...rule, id: 2, required: false };
    const result = submissionUploadInput(
      [rule, optional],
      { 1: new File([new Uint8Array(1048576)], 'report.PDF') },
      {},
      ' 설명 ',
      ' 변경 ',
    );
    expect(result.files).toHaveLength(1);
    expect(result.description).toBe('설명');
    expect(result.changeNote).toBe('변경');
  });
  it('필수 링크를 검증하고 실행 URL과 자격증명 URL은 거절한다', () => {
    const link: RequiredSubmissionArtifact = { ...rule, type: 'LINK' };
    expect(() => submissionUploadInput([link], {}, {}, '설명', '')).toThrow(
      '입력',
    );
    expect(() =>
      submissionUploadInput(
        [link],
        {},
        { 1: 'javascript:alert(1)' },
        '설명',
        '',
      ),
    ).toThrow('http');
    expect(safeSubmissionUrl('https://user:pass@example.com')).toBeUndefined();
  });
});
