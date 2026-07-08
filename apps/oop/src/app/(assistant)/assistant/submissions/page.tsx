import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantSubmissionsPage() {
  return (
    <PagePlaceholder
      title='조교 제출물 검토'
      description='조교가 담당 제출물을 필터링하고 검토하는 페이지입니다.'
      todos={['검토 대기 제출물 목록', '분반/팀/마일스톤 필터', '제출 상세 이동']}
    />
  );
}
