import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type UpdatePresentationOrderInput = {
  milestoneId: string;
  teamOrders: Array<{ teamId: number; order: number }>;
};

/** 담당 교수가 발표 평가 마일스톤의 팀별 발표 순서를 일괄 저장한다. */
export async function updatePresentationOrder({
  milestoneId,
  teamOrders,
}: UpdatePresentationOrderInput): Promise<void> {
  await apiClient.patch(ENDPOINTS.SUBMISSION.PRESENTATION_ORDER(milestoneId), {
    teamOrders,
  });
}
