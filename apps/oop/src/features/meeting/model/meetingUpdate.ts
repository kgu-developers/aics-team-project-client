import type {
  MeetingPhase,
  MeetingRecordUpdateRequest,
  UpdateMeetingRecordInput,
} from '@aics/core';

import type { StudentMeetingRecord } from './studentMeeting';

/** Compare against the record opened by the editor, never a background refetch. */
export function meetingUpdateRequest(
  original: StudentMeetingRecord,
  input: UpdateMeetingRecordInput,
  phase: MeetingPhase,
): MeetingRecordUpdateRequest {
  const patch: MeetingRecordUpdateRequest = {};
  if (input.title !== original.title) patch.title = input.title.trim();
  if (phase !== original.phase) patch.phase = phase;
  // The form edits minutes; omit unchanged dates to retain seconds/precision.
  if (
    input.heldAt.replace(' ', 'T').slice(0, 16) !==
    original.heldAt.replace(' ', 'T').slice(0, 16)
  )
    patch.meetingAt = input.heldAt;
  if ((input.location ?? '') !== (original.location ?? ''))
    patch.location = input.location ?? '';
  if (JSON.stringify(input.content) !== JSON.stringify(original.content))
    patch.content = JSON.stringify(input.content);
  const participantIds = [...input.participantUserIds].sort();
  const originalIds = original.participants.map(person => person.userId).sort();
  if (JSON.stringify(participantIds) !== JSON.stringify(originalIds))
    patch.participantIds = input.participantUserIds;
  return patch;
}
