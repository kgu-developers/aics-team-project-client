import type {
  CreateMeetingActionInput,
  CreateMeetingRecordInput,
  MeetingParticipant,
  MeetingRecord,
  SaveMeetingActionInput,
  UpdateMeetingActionInput,
  UpdateMeetingRecordInput,
} from '@aics/core';

export const demoMeetingTeamId = 'team-07';
const members: MeetingParticipant[] = [
  { userId: 'student-a', name: 'OOP 데모 학생 A' },
  { userId: 'student-b', name: 'OOP 데모 학생 B' },
  { userId: 'student-c', name: 'OOP 데모 학생 C' },
  { userId: 'student-d', name: 'OOP 데모 학생 D' },
  { userId: 'student-e', name: 'OOP 데모 학생 E' },
];
const emptyDoc = { type: 'doc', content: [{ type: 'paragraph' }] };
const markdownLikeDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: '이번 회의 결정' }],
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'MVP 범위는 회의록과 액션 플랜까지로 고정한다.',
                },
              ],
            },
          ],
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: '다음 주까지 도메인 모델 초안을 공유한다.',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'blockquote',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: '결정 사항은 회의록에 남기고, 실행 항목은 액션 플랜으로 분리한다.',
            },
          ],
        },
      ],
    },
  ],
};
const demoLeader = members[0]!;
const initialRecords: MeetingRecord[] = [
  {
    id: 'meeting-home-3',
    teamId: demoMeetingTeamId,
    title: '화면 설계 검토',
    heldAt: '2026-10-03T18:00:00+09:00',
    location: '공학관 302호',
    content: emptyDoc,
    participants: members.slice(0, 5),
    actions: [
      {
        id: 'meeting-action-home-3',
        meetingId: 'meeting-home-3',
        content: '모바일 화면 수정 사항 반영',
        status: 'IN_PROGRESS',
        assignee: members[2]!,
        dueDate: '2026-10-06',
        createdAt: '2026-10-03T19:00:00+09:00',
        updatedAt: '2026-10-03T19:00:00+09:00',
      },
    ],
    createdBy: members[1]!,
    createdAt: '2026-10-03T19:00:00+09:00',
    updatedAt: '2026-10-03T19:00:00+09:00',
  },
  {
    id: 'meeting-home-2',
    teamId: demoMeetingTeamId,
    title: '요구사항 정리 회의',
    heldAt: '2026-10-02T18:00:00+09:00',
    location: '온라인',
    content: emptyDoc,
    participants: members.slice(0, 4),
    actions: [
      {
        id: 'meeting-action-home-2',
        meetingId: 'meeting-home-2',
        content: '회의록 테이블 요구사항 정리',
        status: 'TODO',
        assignee: members[2]!,
        dueDate: '2026-10-05',
        createdAt: '2026-10-02T19:00:00+09:00',
        updatedAt: '2026-10-02T19:00:00+09:00',
      },
    ],
    createdBy: demoLeader,
    createdAt: '2026-10-02T19:00:00+09:00',
    updatedAt: '2026-10-02T19:00:00+09:00',
  },
  {
    id: 'meeting-1',
    teamId: demoMeetingTeamId,
    title: '프로젝트 킥오프',
    heldAt: '2026-10-01T18:00:00+09:00',
    location: '공학관 301호',
    content: markdownLikeDoc,
    participants: members.slice(0, 3),
    actions: [
      {
        id: 'meeting-action-1',
        meetingId: 'meeting-1',
        content: '도메인 모델 초안 작성',
        status: 'TODO',
        assignee: demoLeader,
        dueDate: '2026-10-05',
        createdAt: '2026-10-01T19:00:00+09:00',
        updatedAt: '2026-10-01T19:00:00+09:00',
      },
    ],
    createdBy: demoLeader,
    createdAt: '2026-10-01T19:00:00+09:00',
    updatedAt: '2026-10-01T19:00:00+09:00',
  },
  {
    id: 'meeting-other-team',
    teamId: 'team-99',
    title: '다른 팀 회의',
    heldAt: '2026-10-02T18:00:00+09:00',
    location: null,
    content: emptyDoc,
    participants: [demoLeader],
    actions: [],
    createdBy: demoLeader,
    createdAt: '2026-10-02T18:00:00+09:00',
    updatedAt: '2026-10-02T18:00:00+09:00',
  },
];
const clone = <T>(value: T) => structuredClone(value);
let nextMeeting = 2;
let nextAction = 2;
let records = clone(initialRecords);

export function resetMeetingMockData() {
  nextMeeting = 2;
  nextAction = 2;
  records = clone(initialRecords);
}

export const getMeetingRecords = (teamId: string) =>
  clone(records.filter(record => record.teamId === teamId));
export const getTeamMeetingActions = (teamId: string) =>
  clone(
    records
      .filter(record => record.teamId === teamId)
      .flatMap(record =>
        record.actions.map(action => ({
          ...action,
          meetingRecord: { id: record.id, title: record.title },
        })),
      ),
  );
export const getMeetingRecord = (id: string) => {
  const record = records.find(value => value.id === id);
  return record && clone(record);
};
const participants = (ids: string[]) =>
  members.filter(member => ids.includes(member.userId));
const assignee = (id: string | null | undefined) =>
  id ? (members.find(member => member.userId === id) ?? null) : null;
function buildActions(
  meetingId: string,
  inputActions: SaveMeetingActionInput[],
  existingActions: MeetingRecord['actions'] = [],
) {
  const now = new Date().toISOString();

  return inputActions.map(input => {
    const existing = input.id
      ? existingActions.find(action => action.id === input.id)
      : undefined;

    return {
      id: existing?.id ?? `meeting-action-${nextAction++}`,
      meetingId,
      content: input.content.trim(),
      status: existing?.status ?? 'TODO',
      assignee: assignee(input.assigneeUserId),
      dueDate: input.dueDate || null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  });
}
export function createMeetingRecord(
  teamId: string,
  author: MeetingParticipant,
  input: CreateMeetingRecordInput,
) {
  const now = new Date().toISOString();
  const meetingId = `meeting-${nextMeeting++}`;
  const record: MeetingRecord = {
    id: meetingId,
    teamId,
    title: input.title.trim(),
    heldAt: input.heldAt,
    location: input.location?.trim() || null,
    content: clone(input.content),
    participants: participants(input.participantUserIds),
    actions: buildActions(meetingId, input.actions),
    createdBy: author,
    createdAt: now,
    updatedAt: now,
  };
  records = [record, ...records];
  return clone(record);
}
export function updateMeetingRecord(
  id: string,
  input: UpdateMeetingRecordInput,
) {
  const index = records.findIndex(record => record.id === id);
  if (index < 0) return undefined;
  const record = records[index]!;
  const existingActionIds = new Set(record.actions.map(action => action.id));
  if (
    input.actions.some(
      action => action.id !== undefined && !existingActionIds.has(action.id),
    )
  )
    return undefined;
  const now = new Date().toISOString();
  const next: MeetingRecord = {
    ...record,
    title: input.title.trim(),
    heldAt: input.heldAt,
    location: input.location?.trim() || null,
    content: clone(input.content),
    participants: participants(input.participantUserIds),
    actions: buildActions(id, input.actions, record.actions),
    updatedAt: now,
  };
  records[index] = next;
  return clone(next);
}
export function deleteMeetingRecord(id: string) {
  const before = records.length;
  records = records.filter(record => record.id !== id);
  return before !== records.length;
}
export function updateMeetingAction(
  meetingId: string,
  actionId: string,
  input: UpdateMeetingActionInput,
) {
  const record = records.find(value => value.id === meetingId);
  const action = record?.actions.find(value => value.id === actionId);
  if (!action) return undefined;
  if (input.content !== undefined) action.content = input.content.trim();
  if (input.assigneeUserId !== undefined)
    action.assignee =
      members.find(member => member.userId === input.assigneeUserId) ?? null;
  if (input.dueDate !== undefined) action.dueDate = input.dueDate || null;
  if (input.status !== undefined) action.status = input.status;
  const now = new Date().toISOString();
  action.updatedAt = now;
  record!.updatedAt = now;
  return clone(action);
}

export function createMeetingAction(
  meetingId: string,
  input: CreateMeetingActionInput,
) {
  const record = records.find(value => value.id === meetingId);
  if (!record) return undefined;
  const [action] = buildActions(meetingId, [input]);
  if (!action) return undefined;
  record.actions.push(action);
  record.updatedAt = action.updatedAt;
  return clone(action);
}

export function getMeetingRecordByActionId(actionId: string) {
  const record = records.find(value =>
    value.actions.some(action => action.id === actionId),
  );
  return record && clone(record);
}
export const isMeetingMemberId = (id: string) =>
  members.some(member => member.userId === id);
