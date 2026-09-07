import { isAxiosError } from 'axios';

export class MeetingCreateError extends Error {
  public readonly uncertain: boolean;

  constructor(error: unknown) {
    const uncertain =
      !isAxiosError(error) || !error.response || error.response.status >= 500;
    const isDataConflict =
      isAxiosError<{ code?: string }>(error) &&
      error.response?.status === 409 &&
      error.response.data?.code === 'DATA_CONFLICT';
    super(
      uncertain
        ? '저장 결과를 확인할 수 없어요. 회의록 목록에서 저장된 내용을 확인해 주세요.'
        : isDataConflict
          ? '서버 데이터 충돌로 회의록을 저장하지 못했어요. 입력 내용은 유지돼요. 문제가 계속되면 관리자에게 문의해 주세요.'
          : '회의록을 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.',
    );
    this.uncertain = uncertain;
  }
}
