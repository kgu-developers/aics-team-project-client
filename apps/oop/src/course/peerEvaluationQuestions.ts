export const peerEvaluationProjectQuestions = [
  {
    description: '맡은 역할과 실제 수행 작업',
    label: '자신의 역할 요약',
  },
  {
    description: '결과물과 협업의 잘된 점·아쉬운 점',
    label: '팀 프로젝트 평가',
  },
  {
    description: '소감이나 칭찬할 팀원의 기여',
    label: '소감 또는 팀원 칭찬',
  },
] as const;

export const peerEvaluationTeammateQuestions = [
  {
    description: '팀원 전체 기여도 합계는 100%여야 합니다.',
    label: '기여도 (%)',
  },
  {
    description: '담당한 작업과 실제 기여를 구체적으로 작성합니다.',
    label: '기여 내용',
  },
  {
    description: '협업 과정에서 확인한 기여를 한 줄로 작성합니다.',
    label: '한줄평가',
  },
] as const;
