import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantTeamsPage() {
  return (
    <PagePlaceholder
      title='조교 팀 관리'
      description='조교 권한에서 팀 목록과 상태를 확인하는 페이지입니다.'
      todos={['담당 범위 내 팀 목록', '팀 상세 이동', '팀원/주제/제출 상태 요약']}
    />
  );
}
