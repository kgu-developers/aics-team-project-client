import { isAxiosError } from 'axios';

export function getTopicFinalizationError(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 400)
      return '주제 후보와 프로젝트 목표를 확인해 주세요.';
    if (error.response?.status === 401)
      return '다시 로그인한 뒤 주제를 확정해 주세요.';
    if (error.response?.status === 403)
      return '이 팀의 팀장만 주제를 확정할 수 있어요.';
    if (error.response?.status === 404)
      return '선택한 주제 후보를 찾을 수 없어요. 목록을 다시 확인해 주세요.';
    if (error.response?.status === 409)
      return '현재 프로젝트 상태에서는 주제를 변경할 수 없어요. 프로젝트 내용을 확인해 주세요.';
  }
  return '주제를 확정하지 못했어요. 요청 결과를 확인해 주세요.';
}
