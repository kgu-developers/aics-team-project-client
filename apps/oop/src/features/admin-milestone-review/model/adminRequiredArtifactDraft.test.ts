import { describe, expect, it } from 'vitest';

import { createAdminRequiredArtifactDrafts } from './adminRequiredArtifactDraft';

describe('createAdminRequiredArtifactDrafts', () => {
  it('프리셋의 고정 항목을 생성 전 수정 가능한 산출물 초안으로 변환한다', () => {
    expect(createAdminRequiredArtifactDrafts('final-report')).toEqual([
      {
        allowedExtensions: ['pdf'],
        clientId: 'final-report-0',
        label: '최종보고서 PDF',
        required: true,
        type: 'FILE',
      },
      {
        allowedExtensions: ['zip'],
        clientId: 'final-report-1',
        label: '최종 소스코드 ZIP',
        required: true,
        type: 'FILE',
      },
    ]);
  });

  it('발표 프리셋은 자료 제출용 FILE과 시연 영상 LINK 초안을 제공한다', () => {
    expect(createAdminRequiredArtifactDrafts('presentation-submit')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: '프레젠테이션 자료', type: 'FILE' }),
        expect.objectContaining({ label: '시연 영상', type: 'LINK' }),
      ]),
    );
  });

  it('상호 평가 프리셋은 고정 응답 양식을 사용하므로 제출 산출물을 만들지 않는다', () => {
    expect(createAdminRequiredArtifactDrafts('peer-review')).toEqual([]);
  });
});
