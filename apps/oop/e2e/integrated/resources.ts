import type { Run } from './data';

type State =
  'planned' | 'unknown' | 'created' | 'updated' | 'deleted' | 'residual';
export function createResources(run: Run) {
  return {
    runKey: run.key,
    purpose:
      '실행 소유 데이터의 수동 정리 인계. 자동 삭제 또는 계정 재사용 도구가 아니다.',
    preserve: ['기존 관리자 계정', '다른 실행 키와 실사용 데이터'],
    scope: {
      courseName: run.course,
      sectionCode: run.section,
      teamNames: [run.team, run.comparison],
      studentNumbers: Object.values(run.users).map(user => user.studentNumber),
    },
    meeting: {
      intendedTitle: run.meetingTitle,
      editedTitle: run.meetingEditedTitle,
      studentDetailPath: '',
      adminDetailPath: '',
      adminListPath: '',
      creationStage: 'M01',
      state: 'planned' as State,
      edited: false,
      lastVerifiedStage: '',
      deletionAttempt: '',
      deletionResult: '',
    },
    action: {
      intendedText: run.actionText,
      assigneeRole: run.actionAssignee,
      assigneeName: run.users[run.actionAssignee].name,
      dueDate: run.actionDue,
      owningMeetingPath: '',
      state: 'planned' as State,
      cascadeVerified: false,
    },
    notice: {
      intendedTitle: run.noticeTitle,
      editedTitle: run.noticeEditedTitle,
      sectionCode: run.section,
      adminPath: '',
      studentPath: '',
      state: 'planned' as State,
      editState: 'planned' as State,
      residual: true,
      reason: '전체 공지 삭제는 승인 범위 밖. 생성 분반에만 알림 발송.',
    },
    blockers: [] as { stageId: string; reason: string }[],
    cleanup: { result: 'pending', reason: '' },
    browserLocalReadState:
      '새 글 배지의 읽음 상태는 브라우저 로컬 저장소에만 유지되며 context 종료 시 폐기한다. 서버 정리 대상이 아니다.',
    manualCleanupOrder: [
      '서버 알림 행·공지',
      '회의 액션·참석자·편집 잠금·회의록',
      '평가 응답·평가 항목·양식',
      '제출 버전·파일 연결·팀원 확인·최종 완료 상태',
      '중간 점검 문서·영역 완료·편집 잠금·수정 요청',
      '제안서 완료 상태·피드백·팀 쪽지',
      '프로젝트·주제 후보·투표',
      '팀 배정·팀장 확정·설문 응답',
      '수강 등록·학생 계정·마일스톤·전용 분반·전용 강좌',
    ],
    alternative:
      '다음 실행은 항상 새 실행 키와 새 계정을 사용한다. 기존 데이터 초기화 불필요.',
  };
}
