import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function AssistantPage() {
  return (
    <PagePlaceholder
      title='조교 대시보드'
      description='조교가 담당 분반과 검토해야 할 팀/제출 상태를 확인하는 홈입니다.'
      todos={['담당 분반 현황 요약', '리스크 팀 표시', '검토 대기 제출물 연결']}
    />
  );
}
