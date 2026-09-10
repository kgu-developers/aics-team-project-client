import type { PeerEvaluationTargets, StudentHomeMilestone } from '@aics/core';

import { ROUTES } from '~/app/constants/routes';

type PeerEvaluationHomeState = {
  data?: PeerEvaluationTargets;
  formId?: string;
  isPending: boolean;
  error: unknown;
};

export function peerEvaluationHomeSummary(
  summary: StudentHomeMilestone,
  query: PeerEvaluationHomeState,
  hasTeam: boolean,
  hasSinglePeerMilestone: boolean,
): StudentHomeMilestone {
  const result = {
    ...summary,
    status: 'unavailable' as StudentHomeMilestone['status'],
    currentStepLabel: '상호평가',
    statusLabel: '상태 확인 필요',
  };
  let value = '상호평가 화면에서 확인해 주세요.';
  let actionLabel = '상호평가 확인';
  let actionDisabled = false;
  if (!hasTeam) {
    result.statusLabel = '팀 배정 대기';
    value = '팀 배정 후 평가할 수 있어요.';
    actionDisabled = true;
  } else if (query.error) {
    result.statusLabel = '조회 실패';
    value = '상호평가를 다시 불러와 주세요.';
  } else if (query.isPending) {
    result.statusLabel = '조회 중';
    value = '내 상호평가 응답을 불러오는 중이에요.';
    actionDisabled = true;
  } else if (!query.formId) {
    result.statusLabel = '양식 준비 중';
    value = '상호평가 양식이 아직 준비되지 않았어요.';
  } else if (query.data && hasSinglePeerMilestone) {
    // The current contract exposes formId but not its milestoneId. Never copy
    // one form's completion onto several milestones or match by mutable titles.
    const data = query.data;
    const submitted = data.myResponse?.status === 'SUBMITTED';
    result.status = submitted
      ? 'completed'
      : data.windowState === 'OPEN'
        ? 'in-progress'
        : data.windowState === 'UPCOMING'
          ? 'before-period'
          : 'closed';
    result.statusLabel = submitted
      ? '제출 완료'
      : data.windowState === 'UPCOMING'
        ? '기간 전'
        : data.windowState === 'CLOSED'
          ? '미제출 · 마감'
          : data.myResponse
            ? '작성 중'
            : '미작성';
    value = submitted
      ? '내 상호평가를 제출했어요.'
      : data.windowState !== 'OPEN'
        ? data.windowMessage
        : data.targets.length === 0
          ? '평가할 팀원이 없어요.'
          : data.myResponse
            ? '임시 저장한 응답이 있어요.'
            : '프로젝트 평가와 팀원 기여도를 작성해 주세요.';
    actionLabel = submitted
      ? '제출 내역 보기'
      : data.windowState !== 'OPEN' || data.targets.length === 0
        ? '상호평가 확인'
        : data.myResponse
          ? '이어 작성'
          : '상호평가 작성';
  }
  result.rows = [
    {
      id: 'peer-evaluation',
      label: '내 상호평가',
      value,
      tone: 'primary',
      actionLabel,
      actionDisabled,
      actionTo: ROUTES.STUDENT.PEER_REVIEW,
    },
  ];
  return result;
}
