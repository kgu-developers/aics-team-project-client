import { describe, expect, it } from 'vitest';

import {
  actionDueDate,
  createActionRequest,
  updateActionRequest,
} from './actionPlan';

describe('액션 플랜 요청 변환', () => {
  it('미정 값은 등록 요청에서 생략하고 상태는 서버 기본값에 맡긴다', () => {
    expect(
      createActionRequest({
        content: '  구현 확인  ',
        assigneeUserId: null,
        dueDate: null,
      }),
    ).toEqual({ content: '구현 확인' });
  });
  it('담당자 학번의 앞자리 0을 보존하고 날짜를 현지 일자 마감으로 전송한다', () => {
    expect(
      createActionRequest({
        content: '구현 확인',
        assigneeUserId: '020260001',
        dueDate: '2026-09-10',
      }),
    ).toEqual({
      content: '구현 확인',
      assigneeId: '020260001',
      dueAt: '2026-09-10T23:59:00',
    });
  });
  it('수정 요청에서 생략과 명시적 해제를 구분한다', () => {
    expect(updateActionRequest({ content: '내용' })).toEqual({
      content: '내용',
    });
    expect(
      updateActionRequest({ assigneeUserId: null, dueDate: null }),
    ).toEqual({ clearAssignee: true, clearDueAt: true });
    expect(
      updateActionRequest({
        status: 'DONE',
        dueDate: '2026-10-01',
        assigneeUserId: '20260003',
      }),
    ).toEqual({
      status: 'DONE',
      dueAt: '2026-10-01T23:59:00',
      assigneeId: '20260003',
    });
  });
  it.each(['2026-09-10 18:00', '2026-09-10T18:00:00', '2026-09-10'])(
    '서버 날짜 %s를 시간대 이동 없이 달력 일자로 표시한다',
    value => {
      expect(actionDueDate(value)).toBe('2026-09-10');
    },
  );
});
