import { isAxiosError } from 'axios';

export class MeetingUpdateError extends Error {
  readonly uncertain: boolean;
  readonly blocksRetry: boolean;

  constructor(error: unknown) {
    const status = isAxiosError(error) ? error.response?.status : undefined;
    const uncertain = status === undefined || status >= 500;
    super(
      uncertain
        ? '저장 결과를 확인할 수 없어요. 입력 내용은 유지돼요. 회의록 상세에서 저장된 내용을 확인한 뒤 다시 수정해 주세요.'
        : status === 401
          ? '로그인이 만료됐어요. 입력 내용을 보관한 뒤 다시 로그인해 주세요.'
          : status === 403
            ? '이 회의록을 수정할 권한이 없어요. 입력 내용은 유지돼요.'
            : status === 404
              ? '회의록이 삭제되었거나 더 이상 접근할 수 없어요. 입력 내용은 유지돼요.'
              : status === 409
                ? '편집 상태가 변경되어 저장하지 못했어요. 입력 내용을 보관하고 회의록 상세를 확인해 주세요.'
                : '회의록을 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.',
    );
    this.uncertain = uncertain;
    this.blocksRetry = uncertain || [401, 403, 404, 409].includes(status!);
  }
}
