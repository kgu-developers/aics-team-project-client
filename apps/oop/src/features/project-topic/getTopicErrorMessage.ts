import { isAxiosError } from 'axios';

export function getTopicErrorMessage(error: unknown) {
  if (isAxiosError(error)) {
    const code = (error.response?.data as { code?: string } | undefined)?.code;
    if (code === 'SELF_VOTE_NOT_ALLOWED') {
      return '내가 등록한 후보에는 투표할 수 없어요.';
    }
    if (error.response?.status === 401) {
      return '로그인한 팀원만 주제 보드를 이용할 수 있어요.';
    }
    if (error.response?.status === 403) {
      return '이 팀의 주제 보드에 접근할 수 없어요.';
    }
    if (error.response?.status === 404) {
      return '선택한 후보를 찾을 수 없어요. 목록을 새로고침해 주세요.';
    }
  }
  return '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.';
}
