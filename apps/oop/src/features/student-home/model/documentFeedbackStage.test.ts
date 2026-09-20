import type { TeamMessage } from '@aics/core';
import { describe, expect, it } from 'vitest';

import {
  midReportFeedbackRoomStage,
  midReportFeedbackStage,
  proposalFeedbackRoomStage,
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
it('팀원 목록이나 메시지를 확인하기 전에는 판정하지 않는다', () => {
  const submittedAt = '2026-09-10 10:00';
  expect(proposalFeedbackStage({ submittedAt, messages: [] })).toBe('unknown');
  expect(
    midReportFeedbackStage({
      submittedAt,
      messages: [],
      teamMemberIds,
      isMessagesReady: false,
    }),
  ).toBe('unknown');
});
it('제출 시각을 읽을 수 없으면 피드백으로 보지 않는다', () => {
  expect(
    proposalFeedbackStage({
      submittedAt: '언젠가',
      messages: [message('professor-1', '2026-09-11 09:00')],
      teamMemberIds,
    }),
  ).toBe('awaiting-feedback');
});

describe('feedback room stage', () => {
  const teamMemberIds = ['s1', 's2'];
  const at = '2026-09-10T10:00:00';

  it('제출 전이라도 교수 메시지가 있으면 제안서 피드백 영역을 연다', () => {
    expect(
      proposalFeedbackRoomStage({
        submittedAt: null,
        messages: [message('prof', at)],
        teamMemberIds,
      }),
    ).toBe('feedback-arrived');
  });

  it('제출했지만 메시지가 없으면 대기, 제출도 메시지도 없으면 감춘다', () => {
    expect(
      proposalFeedbackRoomStage({
        submittedAt: '2026-09-09T10:00:00',
        messages: [],
        teamMemberIds,
      }),
    ).toBe('awaiting-feedback');
    expect(
      proposalFeedbackRoomStage({
        submittedAt: null,
        messages: [],
        teamMemberIds,
      }),
    ).toBe('not-submitted');
  });

  it('중간보고서는 학생 메시지로 시작하고, 메시지 조회 전에는 unknown이다', () => {
    expect(
      midReportFeedbackRoomStage({
        submittedAt: '2026-09-09T10:00:00',
        messages: [message('s1', at)],
        teamMemberIds,
      }),
    ).toBe('feedback-arrived');
    expect(
      midReportFeedbackRoomStage({
        submittedAt: '2026-09-09T10:00:00',
        messages: [message('prof', at)],
        teamMemberIds,
      }),
    ).toBe('awaiting-feedback');
    expect(
      midReportFeedbackRoomStage({
        submittedAt: '2026-09-09T10:00:00',
        teamMemberIds,
        isMessagesReady: false,
      }),
    ).toBe('unknown');
  });
});
