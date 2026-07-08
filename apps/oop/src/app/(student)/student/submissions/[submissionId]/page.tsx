import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentSubmissionsSubmissionIdPage() {
  return (
    <PagePlaceholder
      title='제출 상세'
      description='제출 검증 결과와 제출 내용을 확인하는 페이지입니다.'
      todos={['제출 파일/링크 확인', '검증 결과 표시', '피드백과 재제출 동선 연결']}
    />
  );
}
