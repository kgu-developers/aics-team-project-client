import { expect, it } from 'vitest';

import { documentAccessMessage } from './documentAccessMessage';

it('제출한 문서는 읽기 전용임을 먼저 알린다', () => {
  expect(documentAccessMessage({ isSubmitted: true, canEdit: true })).toBe(
    '제출한 문서예요. 내용은 읽기 전용으로 확인할 수 있어요.',
  );
});
it('다른 팀원이 잡고 있으면 수정 불가와 이름을 함께 알린다', () => {
  expect(
    documentAccessMessage({
      isSubmitted: false,
      lockedByOther: true,
      ownerName: '홍길동',
    }),
  ).toBe(
    '지금은 수정할 수 없어요. 홍길동 님이 편집 중입니다. 편집이 끝난 뒤 다시 열어 주세요.',
  );
});
it('이름을 모르면 다른 팀원으로 알린다', () => {
  expect(
    documentAccessMessage({ isSubmitted: false, lockedByOther: true }),
  ).toBe(
    '지금은 수정할 수 없어요. 다른 팀원이 편집 중입니다. 편집이 끝난 뒤 다시 열어 주세요.',
  );
});
it('편집 중 권한을 잃으면 입력 보존을 알린다', () => {
  expect(
    documentAccessMessage({
      isSubmitted: false,
      isEditing: true,
      canEdit: false,
    }),
  ).toBe(
    '편집 권한이 만료됐어요. 입력 내용은 유지되며, 권한을 다시 확인한 뒤 저장할 수 있어요.',
  );
});
it('잠금 조회가 실패하면 확인 실패를 알린다', () => {
  expect(
    documentAccessMessage({ isSubmitted: false, isLockUnavailable: true }),
  ).toBe(
    '편집 권한을 확인하지 못했어요. 입력 내용을 유지한 채 다시 확인해 주세요.',
  );
});
it('권한이 있으면 저장 방법을 알린다', () => {
  expect(documentAccessMessage({ isSubmitted: false, canEdit: true })).toBe(
    '편집 중입니다. 변경한 내용은 저장 버튼으로 저장해 주세요.',
  );
});
