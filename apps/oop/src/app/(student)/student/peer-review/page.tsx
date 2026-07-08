import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentPeerReviewPage() {
  return (
    <PagePlaceholder
      title='상호평가'
      description='학생이 팀원 기여도와 상호평가를 입력하는 페이지입니다.'
      todos={['팀원 기여도 평가', '제출 가능 기간 안내', '작성 완료 상태 표시']}
    />
  );
}
