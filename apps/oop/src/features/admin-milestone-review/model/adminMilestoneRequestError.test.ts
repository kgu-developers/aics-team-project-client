import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import {
  formatAdminMilestoneRequestError,
  toAdminMilestoneDeleteError,
  toAdminMilestoneRequestError,
} from './adminMilestoneRequestError';

function axiosError(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', undefined, config, undefined, {
    config,
    data,
    headers: {},
    status,
    statusText: '',
  });
}

describe('adminMilestoneRequestError', () => {
  it('서버 message가 있으면 그대로 사용하고 상태·코드를 덧붙인다', () => {
    const error = toAdminMilestoneRequestError(
      axiosError(400, {
        code: 'INVALID_INPUT',
        message: '제목이 너무 깁니다.',
      }),
    );
    expect(error).toEqual({
      code: 'INVALID_INPUT',
      message: '제목이 너무 깁니다.',
      status: 400,
    });
    expect(formatAdminMilestoneRequestError(error)).toBe(
      '제목이 너무 깁니다. (HTTP 400 · INVALID_INPUT)',
    );
  });

  it('code만 오는 계약에서는 상태 코드 설명으로 원인을 채운다', () => {
    expect(
      toAdminMilestoneRequestError(axiosError(409, { code: 'WEEK_TAKEN' }))
        .message,
    ).toContain('주차를 이미 사용 중');
    expect(
      toAdminMilestoneRequestError(axiosError(403, { code: 'FORBIDDEN' }))
        .message,
    ).toContain('권한');
  });

  it('네트워크 오류나 5xx는 서버 응답 문제로 안내한다', () => {
    expect(toAdminMilestoneRequestError(new Error('Network Error'))).toEqual({
      message: 'Network Error',
    });
    expect(
      toAdminMilestoneRequestError(axiosError(502, null)).message,
    ).toContain('서버가 응답하지 않습니다');
  });

  it('삭제 409는 상태와 운영 데이터 제약을 안내한다', () => {
    expect(
      toAdminMilestoneDeleteError(
        axiosError(409, { code: 'MILESTONE_DELETE_CONFLICT' }),
      ),
    ).toEqual({
      code: 'MILESTONE_DELETE_CONFLICT',
      message:
        '미공개 상태가 아니거나 제출·평가 등 운영 데이터가 있어 삭제할 수 없습니다.',
      status: 409,
    });
  });
});
