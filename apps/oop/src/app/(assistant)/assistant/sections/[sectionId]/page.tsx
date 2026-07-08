import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantSectionsSectionIdPage() {
  return (
    <PagePlaceholder
      title='담당 분반 상세'
      description='조교가 특정 담당 분반의 팀과 제출 흐름을 확인하는 페이지입니다.'
      todos={['분반 기본 정보', '팀별 진행 상태', '검토 필요 제출물 연결']}
    />
  );
}
