import type { MeetingPhase } from '@aics/core';

const meetingPhaseLabels: Record<MeetingPhase, string> = {
  FINAL: '최종',
  MID_CHECK: '중간 보고서',
  PROPOSAL: '기획',
};

export function formatAdminMeetingPhase(phase: MeetingPhase) {
  return meetingPhaseLabels[phase];
}
