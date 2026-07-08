import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentProjectTopicPage() {
  return (
    <PagePlaceholder
      title='프로젝트 주제 등록'
      description='팀장이 프로젝트 주제와 관련 링크를 등록하는 페이지입니다.'
      todos={['주제/링크 입력', '승인 상태 표시', '수정 요청 대응']}
    />
  );
}
