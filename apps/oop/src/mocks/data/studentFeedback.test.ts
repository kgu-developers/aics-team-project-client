import { beforeEach, describe, expect, it } from 'vitest';

import {
  createMidReportFeedback,
  createProposalFeedbackResponse,
  demoFeedbackTeamId,
  getMidReportFeedback,
  getProposalFeedbackResponse,
  resetStudentFeedbackMockData,
} from './studentFeedback';

beforeEach(() => resetStudentFeedbackMockData());

describe('student feedback mock data', () => {
  it('팀의 제안서 답변을 한 번만 저장하고 외부 변경으로부터 보호한다', () => {
    const saved = createProposalFeedbackResponse(
      demoFeedbackTeamId,
      'OOP 데모 학생 A',
      { content: '  사용자 흐름을 구체화했습니다.  ' },
    );

    expect(saved).toMatchObject({
      content: '사용자 흐름을 구체화했습니다.',
      submittedBy: 'OOP 데모 학생 A',
    });
    if (!saved) throw new Error('proposal feedback response is required');
    saved.content = '외부에서 변경한 값';

    expect(getProposalFeedbackResponse(demoFeedbackTeamId)?.content).toBe(
      '사용자 흐름을 구체화했습니다.',
    );
    expect(
      createProposalFeedbackResponse(demoFeedbackTeamId, 'OOP 데모 학생 B', {
        content: '두 번째 답변',
      }),
    ).toBeUndefined();
  });

  it('초기화하면 제안서와 중간보고서 제출 상태를 모두 비운다', () => {
    createProposalFeedbackResponse(demoFeedbackTeamId, '학생', {
      content: '반영 답변',
    });
    createMidReportFeedback(demoFeedbackTeamId, '학생', {
      content: '대면 피드백과 반영 내용',
    });

    resetStudentFeedbackMockData();

    expect(getProposalFeedbackResponse(demoFeedbackTeamId)).toBeUndefined();
    expect(getMidReportFeedback(demoFeedbackTeamId)).toBeUndefined();
  });
});
