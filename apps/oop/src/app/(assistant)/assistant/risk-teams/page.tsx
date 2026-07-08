import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantRiskTeamsPage() {
  return (
    <PagePlaceholder
      title='리스크 팀 표시'
      description='진행 지연이나 제출 문제 가능성이 있는 팀을 모아 보는 페이지입니다.'
      todos={['리스크 기준 정의', '팀별 위험 신호 표시', '팀 상세/제출 상세 연결']}
    />
  );
}
