import type { TeamMessage } from '@aics/core';
import { expect, it } from 'vitest';

import {
  midReportFeedbackStage,
  proposalFeedbackStage,
} from './documentFeedbackStage';

const message = (senderId: string, createdAt: string): TeamMessage => ({
  id: 1,
  threadId: 7,
  senderId,
  relatedType: 'PROPOSAL',
  message: '확인해 주세요.',
  createdAt,
  important: false,
  read: false,
});
const teamMemberIds = ['20260001', '20260003'];

it('제출 전에는 피드백 단계가 아니다', () => {
  expect(proposalFeedbackStage({ submittedAt: null, teamMemberIds })).toBe(
    'not-submitted',
  );
});
it('제안서는 교수 메시지가 도착해야 피드백 단계다', () => {
  const submittedAt = '2026-09-10 10:00';
  expect(
    proposalFeedbackStage({
      submittedAt,
      messages: [message('20260001', '2026-09-11 09:00')],
      teamMemberIds,
    }),
  ).toBe('awaiting-feedback');
  expect(
    proposalFeedbackStage({
      submittedAt,
      messages: [message('professor-1', '2026-09-11 09:00')],
      teamMemberIds,
    }),
  ).toBe('feedback-arrived');
});
it('중간보고서는 학생 메시지가 먼저 필요하다', () => {
  const submittedAt = '2026-09-10 10:00';
  expect(
    midReportFeedbackStage({
      submittedAt,
      messages: [message('professor-1', '2026-09-11 09:00')],
      teamMemberIds,
    }),
  ).toBe('awaiting-feedback');
  expect(
    midReportFeedbackStage({
      submittedAt,
      messages: [message('20260003', '2026-09-11 09:00')],
      teamMemberIds,
    }),
  ).toBe('feedback-arrived');
});
it('제출 이전 메시지는 피드백으로 보지 않는다', () => {
  expect(
    proposalFeedbackStage({
      submittedAt: '2026-09-10 10:00',
      messages: [message('professor-1', '2026-09-09 09:00')],
      teamMemberIds,
    }),
  ).toBe('awaiting-feedback');
});
