import { describe, expect, it } from 'vitest';

import type { AdminPeerEvaluationDetailView } from './adminMilestoneSubmissionDetail';
import { toAdminPeerEvaluatorRows } from './adminMilestoneSubmissionDetail';

const peerEvaluation: AdminPeerEvaluationDetailView = {
  members: [
    { major: '컴퓨터공학과', name: '가', studentNumber: '1' },
    { major: '소프트웨어학과', name: '나', studentNumber: '2' },
    { major: '인공지능학과', name: '다', studentNumber: '3' },
  ],
  responses: [
    {
      evaluatorStudentNumber: '1',
      projectEvaluation: {
        reflection: '',
        roleSummary: '',
        teamEvaluation: '',
      },
      scores: { '2': 100, '3': 0 },
    },
    {
      evaluatorStudentNumber: '2',
      projectEvaluation: {
        reflection: '',
        roleSummary: '',
        teamEvaluation: '',
      },
      scores: { '1': 20, '3': 30 },
    },
    {
      evaluatorStudentNumber: '3',
      projectEvaluation: {
        reflection: '',
        roleSummary: '',
        teamEvaluation: '',
      },
      scores: { '1': 90, '2': 80 },
    },
  ],
};

describe('toAdminPeerEvaluatorRows', () => {
  it('평가자별로 제출한 점수의 평균을 계산한다', () => {
    expect(
      toAdminPeerEvaluatorRows(peerEvaluation).map(row => ({
        average: row.average,
        studentNumber: row.evaluator.studentNumber,
      })),
    ).toEqual([
      { average: 50, studentNumber: '1' },
      { average: 25, studentNumber: '2' },
      { average: 85, studentNumber: '3' },
    ]);
  });
});
