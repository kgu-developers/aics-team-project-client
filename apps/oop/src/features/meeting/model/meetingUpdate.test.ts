import { describe, expect, it } from 'vitest';

import { meetingUpdateRequest } from './meetingUpdate';
import { mapStudentMeeting } from './studentMeeting';

import { meetingApiRecord, meetingApiTeam } from '~/mocks/data/meetingApi';

const original = mapStudentMeeting(
  { ...meetingApiRecord, id: '19', teamId: '7', location: null },
  [],
  meetingApiTeam,
);
const input = {
  title: original.title,
  heldAt: original.heldAt.replace(' ', 'T') + ':00',
  location: '',
  content: original.content,
  participantUserIds: original.participants.map(person => person.userId),
  actions: [],
};

describe('회의록 PATCH 변경 필드', () => {
  it('변경 없는 폼은 원본 평문·날짜·null 장소를 다시 직렬화하지 않는다', () => {
    expect(meetingUpdateRequest(original, input, 'MID_CHECK')).toEqual({});
  });

  it('제목만 바꾸면 초 단위 일시와 원본 본문을 덮어쓰지 않는다', () => {
    expect(
      meetingUpdateRequest(
        { ...original, heldAt: '2026-09-07T09:30:42.123456' },
        { ...input, title: ' 새 제목 ' },
        'MID_CHECK',
      ),
    ).toEqual({ title: '새 제목' });
  });

  it('미지원 JSON도 다른 필드만 수정할 때 원본을 덮어쓰지 않는다', () => {
    const record = mapStudentMeeting(
      {
        ...meetingApiRecord,
        id: '19',
        teamId: '7',
        location: null,
        content: '{"type":"unknown"}',
      },
      [],
      meetingApiTeam,
    );
    expect(
      meetingUpdateRequest(
        record,
        { ...input, content: record.content, title: '제목 변경' },
        'MID_CHECK',
      ),
    ).toEqual({ title: '제목 변경' });
  });

  it('참석자 순서만 달라지면 변경 요청에 포함하지 않는다', () => {
    expect(
      meetingUpdateRequest(
        original,
        {
          ...input,
          participantUserIds: [...input.participantUserIds].reverse(),
        },
        'MID_CHECK',
      ),
    ).toEqual({});
  });

  it('변경한 단계·일시·장소·참석자·서식 본문만 서버 필드로 보낸다', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: '결정', marks: [{ type: 'bold' }] }],
        },
      ],
    };
    expect(
      meetingUpdateRequest(
        { ...original, location: '301호' },
        {
          ...input,
          heldAt: '2026-09-08T00:30:00',
          participantUserIds: ['20260004'],
          content,
        },
        'FINAL',
      ),
    ).toEqual({
      phase: 'FINAL',
      meetingAt: '2026-09-08T00:30:00',
      location: '',
      participantIds: ['20260004'],
      content: JSON.stringify(content),
    });
  });

  it('제목이 없는 회의록의 표시용 제목을 저장값으로 보내지 않는다', () => {
    const record = mapStudentMeeting(
      {
        ...meetingApiRecord,
        id: '19',
        teamId: '7',
        title: null,
        location: null,
      },
      [],
      meetingApiTeam,
    );
    expect(
      meetingUpdateRequest(
        record,
        { ...input, title: record.title },
        'MID_CHECK',
      ),
    ).toEqual({});
  });
});
