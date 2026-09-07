import type {
  MeetingActionEntry,
  MeetingPhase,
  MeetingRecord,
  MeetingRecordDetail,
  RichTextJson,
  TeamKickoffResponse,
} from '@aics/core';

export const meetingPhaseLabels: Record<MeetingPhase, string> = {
  PROPOSAL: '기획',
  MID_CHECK: '중간 점검',
  FINAL: '최종',
};

export type StudentMeetingRecord = MeetingRecord & { phase?: MeetingPhase };
export function meetingTitle(title: string | null, phase: MeetingPhase) {
  return title?.trim() || `${meetingPhaseLabels[phase]} 회의록`;
}

export function parseMeetingContent(content: string): RichTextJson {
  try {
    const parsed: unknown = JSON.parse(content);
    if (isRichTextNode(parsed) && parsed.type === 'doc') return parsed;
  } catch {
    // Older records contain plain text. Render it as text, never as HTML.
  }
  return {
    type: 'doc',
    content: content.split(/\r?\n/).map(text => ({
      type: 'paragraph',
      ...(text ? { content: [{ type: 'text', text }] } : {}),
    })),
  };
}

function isRichTextNode(value: unknown): value is RichTextJson {
  if (!value || typeof value !== 'object') return false;
  const node = value as RichTextJson;
  const types = [
    'doc',
    'paragraph',
    'text',
    'heading',
    'bulletList',
    'orderedList',
    'listItem',
    'blockquote',
    'codeBlock',
    'hardBreak',
    'horizontalRule',
  ];
  if (!types.includes(node.type)) return false;
  if (
    node.marks !== undefined &&
    (!Array.isArray(node.marks) ||
      !node.marks.every(
        mark =>
          mark &&
          typeof mark === 'object' &&
          ['bold', 'italic', 'strike', 'code', 'link', 'underline'].includes(
            mark.type,
          ),
      ))
  )
    return false;
  if (node.type === 'text' && typeof node.text !== 'string') return false;
  return (
    node.content === undefined ||
    (Array.isArray(node.content) && node.content.every(isRichTextNode))
  );
}

export function mapStudentMeeting(
  detail: MeetingRecordDetail,
  actions: MeetingActionEntry[],
  kickoff: TeamKickoffResponse,
): StudentMeetingRecord {
  const participant = (userId: string) => ({
    userId,
    name:
      kickoff.members.find(member => member.studentNumber === userId)?.name ||
      userId,
  });
  return {
    id: detail.id,
    teamId: detail.teamId,
    title: meetingTitle(detail.title, detail.phase),
    phase: detail.phase,
    heldAt: detail.meetingAt,
    location: detail.location,
    content: parseMeetingContent(detail.content),
    participants: detail.participantIds.map(participant),
    actions: actions.map(action => ({
      id: action.id,
      meetingId: action.meetingRecordId,
      content: action.content,
      status: action.status,
      assignee: action.assignee,
      dueDate: action.dueAt,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
    })),
    createdBy: participant(detail.authorId),
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}
