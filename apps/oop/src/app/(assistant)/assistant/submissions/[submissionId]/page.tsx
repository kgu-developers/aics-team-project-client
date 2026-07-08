import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantSubmissionsSubmissionIdPage() {
  return (
    <PagePlaceholder
      title='조교 제출물 상세'
      description='조교가 제출물 상세와 피드백/메모를 검토하는 페이지입니다.'
      todos={['제출물 열람', '공개 피드백/내부 메모 작성', '수정 요청 후보 표시']}
    />
  );
}
