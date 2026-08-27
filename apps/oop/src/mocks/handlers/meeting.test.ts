import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { CreateMeetingRecordInput, MeetingRecord } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { meetingHandlers } from './meeting';
import { getMeetingRecord, resetMeetingMockData } from '../data/meeting';
import { demoAccessToken, demoPartnerAccessToken } from '../data/users';

const leaderHeaders = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const memberHeaders = {
  Authorization: `Bearer ${demoPartnerAccessToken}`,
  'Content-Type': 'application/json',
};
const validInput: CreateMeetingRecordInput = {
  title: '리뷰 반영 회의',
  heldAt: '2026-10-03T00:00:00.000Z',
  location: '온라인',
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
  participantUserIds: ['student-a', 'student-b'],
  actions: [
    {
      content: '권한 계약 테스트 추가',
      assigneeUserId: 'student-b',
      dueDate: '2026-10-05',
    },
  ],
};
const server = setupServer(...meetingHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetMeetingMockData();
  server.resetHandlers();
});
afterAll(() => server.close());

describe('meetingHandlers', () => {
  it('회의록과 액션 플랜을 한 요청에서 생성한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS('team-07')}`,
      {
        method: 'POST',
        headers: leaderHeaders,
        body: JSON.stringify(validInput),
      },
    );
    const record = (await response.json()) as MeetingRecord;

    expect(response.status).toBe(201);
    expect(record).toMatchObject({
      teamId: 'team-07',
      createdBy: { userId: 'student-a' },
      actions: [
        {
          content: '권한 계약 테스트 추가',
          assignee: { userId: 'student-b' },
        },
      ],
    });
  });

  it('잘못된 액션 플랜이 포함되면 회의록 전체를 생성하지 않는다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MEETING.RECORDS('team-07')}`,
      {
        method: 'POST',
        headers: leaderHeaders,
        body: JSON.stringify({
          ...validInput,
          actions: [{ ...validInput.actions[0], content: '   ' }],
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_MEETING_RECORD',
    });
    expect(getMeetingRecord('meeting-2')).toBeUndefined();
  });

  it('작성자도 팀장도 아닌 팀원의 삭제 요청을 거부한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD('meeting-1')}`,
      { method: 'DELETE', headers: memberHeaders },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      code: 'MEETING_DELETE_FORBIDDEN',
    });
    expect(getMeetingRecord('meeting-1')).toBeDefined();
  });

  it('지원하지 않는 액션 플랜 상태를 거부하고 기존 상태를 유지한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MEETING.ACTION('meeting-action-1')}`,
      {
        method: 'PUT',
        headers: leaderHeaders,
        body: JSON.stringify({ status: 'CANCELLED' }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'INVALID_MEETING_ACTION',
    });
    expect(getMeetingRecord('meeting-1')?.actions[0]?.status).toBe('TODO');
  });

  it('작성자이자 팀장인 사용자는 회의록을 삭제한다', async () => {
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.MEETING.RECORD('meeting-1')}`,
      { method: 'DELETE', headers: leaderHeaders },
    );

    expect(response.status).toBe(204);
    expect(getMeetingRecord('meeting-1')).toBeUndefined();
  });
});
