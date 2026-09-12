import type { ProposalSectionsResponse } from '@aics/core';
import { AxiosError, AxiosHeaders } from 'axios';
import { expect, it } from 'vitest';

import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';

import { proposalSubmitBlocker } from './proposalSubmitGuard';

const project = { title: '제목', description: '설명', goal: '목표' };
function sections(completed: boolean): ProposalSectionsResponse {
  return {
    allCompleted: completed,
    contents: (['TOPIC', 'DATA', 'SCREEN', 'TEAM_OPERATION'] as const).map(
      section => ({
        assigneeName: null,
        assigneeUserId: null,
        completed: completed || section !== 'SCREEN',
        completedAt: null,
        section,
      }),
    ),
  };
}
function axios(status: number, data: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, null, {
    config: { headers: new AxiosHeaders() },
    data,
    headers: {},
    status,
    statusText: '',
  });
}
it('비어 있는 필수 입력을 이름으로 알린다', () => {
  expect(
    proposalSubmitBlocker({ ...project, goal: '   ' }, sections(true)),
  ).toBe(
    '프로젝트 목표를 채워야 제출할 수 있어요. 주제 영역에서 입력해 주세요.',
  );
});
it('미완료 영역을 이름으로 알린다', () => {
  expect(proposalSubmitBlocker(project, sections(false))).toBe(
    '화면 구성 영역을 작성 완료해야 제출할 수 있어요.',
  );
});
it('채울 것이 없으면 막지 않는다', () => {
  expect(proposalSubmitBlocker(project, sections(true))).toBeNull();
});
it('서버 원문보다 상태 코드 안내를 먼저 쓴다', () => {
  expect(
    documentRequestErrorMessage(
      axios(500, { message: 'Internal Server Error' }),
    ),
  ).toBe(
    '서버가 요청을 처리하지 못했어요. 빈 입력이 없는지 확인한 뒤 다시 시도해 주세요.',
  );
});
it('알려진 오류 코드는 코드에 맞는 안내를 쓴다', () => {
  expect(
    documentRequestErrorMessage(
      axios(409, { code: 'PROJECT_PROPOSAL_COMPLETED' }),
    ),
  ).toBe('이미 제출된 제안서예요. 최신 내용을 다시 조회해 주세요.');
});
it('매핑이 없으면 서버 문구를 마지막으로 쓴다', () => {
  expect(
    documentRequestErrorMessage(axios(418, { message: '커스텀 오류' })),
  ).toBe('커스텀 오류');
});
