import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMilestoneSubmissionStatusDto =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'FEEDBACK_PROVIDED'
  | 'REVISION_REQUESTED'
  | 'COMPLETED';

export type AdminMilestoneSubmissionItemDto = {
  canSubmitNow: boolean;
  completedAt?: string | null;
  completedBy?: string | null;
  currentVersion: number;
  /**
   * 제안서·중간보고서의 담당 교수 피드백 누적 수.
   * 구버전 서버와 배포 순서가 달라도 목록을 계속 표시할 수 있게 선택값으로 둔다.
   */
  feedbackCount?: number;
  /** 제안서·중간보고서의 최신 학생 활동 이후 교수 피드백 대기 여부. */
  feedbackRequested?: boolean;
  hasPendingReview: boolean;
  meetingRecordCount: number;
  /** Nullable for teams without a designated leader and older API deployments. */
  leaderName?: string | null;
  /**
   * 팀의 모든 회의록 수. 구버전 서버 응답과의 배포 순서 호환을 위해
   * 새 필드는 선택값으로 수용한다.
   */
  totalMeetingRecordCount?: number;
  id: number;
  milestoneId: number;
  /**
   * 중간보고서 문서 식별자. 현재 상태가 NOT_SUBMITTED로 다시 열려 있어도
   * 이전에 생성된 문서가 존재하는지 판별하는 데 사용한다.
   */
  midReportId?: number | null;
  presentationOrder?: number | null;
  /** 제안서의 가장 최근 제출 시각. 수정 요청으로 문서가 다시 열려도 보존된다. */
  proposalCompletedAt?: string | null;
  /**
   * 제안서 프로젝트 식별자. 수정 요청으로 현재 제출 버전이 0이어도
   * 기존 프로젝트 문서 상세를 열 수 있는지 판단하는 데 사용한다.
   */
  projectId?: number | null;
  projectTitle?: string | null;
  status: AdminMilestoneSubmissionStatusDto;
  teamId: number;
  teamName: string;
};

export type AdminMilestoneSubmissionsResponse = {
  contents: AdminMilestoneSubmissionItemDto[];
};

export async function fetchAdminMilestoneSubmissions(
  milestoneId: string,
  teamId?: string,
): Promise<AdminMilestoneSubmissionsResponse> {
  const response = await apiClient.get<AdminMilestoneSubmissionsResponse>(
    ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(milestoneId),
    { params: teamId ? { teamId } : undefined },
  );

  return response.data;
}
