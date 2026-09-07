import { describe, expect, it } from 'vitest';

import { mapStudentMeeting, parseMeetingContent } from './studentMeeting';

import {
  meetingApiAction,
  meetingApiRecord,
  meetingApiTeam,
} from '~/mocks/data/meetingApi';

describe('회의록 내용과 표시 변환', () => {
  it('서식 JSON을 유지하고 평문·HTML·잘못된 JSON은 텍스트로 표시한다', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '결정', marks: [{ type: 'bold' }] }],
        },
      ],
    };
    expect(parseMeetingContent(JSON.stringify(doc))).toEqual(doc);
    for (const text of [
      '첫 줄\n다음 줄',
      '<script>alert(1)</script>',
      '{invalid',
      '{"type":"doc","content":"bad"}',
    ]) {
      const result = parseMeetingContent(text);
      expect(result.type).toBe('doc');
      expect(JSON.stringify(result)).toContain(
        JSON.stringify(text.split('\n')[0]!).slice(1, -1),
      );
    }
  });
  it('내부 팀원 ID 대신 학번으로 이름을 찾고 탈퇴한 참가자의 학번도 보존한다', () => {
    const record = mapStudentMeeting(
      {
        ...meetingApiRecord,
        id: '19',
        teamId: '7',
        location: null,
        title: null,
        participantIds: ['20260001', '020260099'],
      },
      [
        {
          ...meetingApiAction,
          id: '41',
          meetingRecordId: '19',
          assignee: meetingApiAction.assignee ?? null,
          dueAt: meetingApiAction.dueAt ?? null,
        },
      ],
      meetingApiTeam,
    );
    expect(record.title).toBe('중간 점검 회의록');
    expect(record.participants).toEqual([
      { userId: '20260001', name: 'OOP 데모 학생 A' },
      { userId: '020260099', name: '020260099' },
    ]);
    expect(record.actions[0]?.assignee?.userId).toBe('20260003');
    expect(record.heldAt).toBe('2026-09-07 09:30');
  });
});
