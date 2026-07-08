import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorAuditLogsPage() {
  return (
    <PagePlaceholder
      title='감사 로그'
      description='분반, 팀, 평가, 권한 변경에 대한 운영 이력을 확인하는 페이지입니다.'
      todos={['로그 목록 필터', '변경자/대상/시간 표시', '중요 변경 추적']}
    />
  );
}
