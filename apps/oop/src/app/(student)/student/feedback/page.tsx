import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentFeedbackPage() {
  return (
    <PagePlaceholder
      title='피드백 확인'
      description='학생이 공개 피드백과 수정 요청 상태를 확인하는 페이지입니다.'
      todos={['피드백 목록', '수정 상태 업데이트', '재제출 동선 연결']}
    />
  );
}
