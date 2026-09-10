import type {
  CreateMeetingActionInput,
  MeetingActionCreateRequest,
  MeetingActionUpdateRequest,
  TeamMeetingAction,
  TeamMeetingActionEntry,
  UpdateMeetingActionInput,
} from '@aics/core';
import { isAxiosError } from 'axios';

export function actionDueDate(value: string | null) {
  return value?.slice(0, 10) ?? '';
}

function actionDueAt(value: string) {
  // The form edits a calendar date. Send server-local end of day, without UTC conversion.
  return `${value}T23:59:00`;
}

export function createActionRequest(
  input: CreateMeetingActionInput,
): MeetingActionCreateRequest {
  return {
    content: input.content.trim(),
    ...(input.assigneeUserId ? { assigneeId: input.assigneeUserId } : {}),
    ...(input.dueDate ? { dueAt: actionDueAt(input.dueDate) } : {}),
  };
}

export function updateActionRequest(
  input: UpdateMeetingActionInput,
): MeetingActionUpdateRequest {
  return {
    ...(input.content !== undefined ? { content: input.content.trim() } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.assigneeUserId !== undefined
      ? input.assigneeUserId
        ? { assigneeId: input.assigneeUserId }
        : { clearAssignee: true }
      : {}),
    ...(input.dueDate !== undefined
      ? input.dueDate
        ? { dueAt: actionDueAt(input.dueDate) }
        : { clearDueAt: true }
      : {}),
  };
}

export function mapActionPlanEntry(
  entry: TeamMeetingActionEntry,
): TeamMeetingAction {
  return {
    id: entry.id,
    meetingId: entry.meetingRecordId,
    content: entry.content,
    status: entry.status,
    assignee: entry.assignee,
    dueDate: entry.dueAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    meetingRecord: {
      id: entry.meetingRecord.id,
      title: entry.meetingRecord.title?.trim() || '제목 없는 회의록',
    },
  };
}

export function actionSaveError(error: unknown) {
  if (isAxiosError<{ code?: string }>(error)) {
    const status = error.response?.status;
    const code = error.response?.data?.code;
    if (status === 409 && code === 'DATA_CONFLICT')
      return '서버 데이터 충돌로 액션 플랜을 저장하지 못했어요. 입력 내용은 유지돼요. 문제가 계속되면 관리자에게 문의해 주세요.';
    if (status === 409)
      return '다른 변경과 충돌했어요. 목록을 새로고침한 뒤 다시 확인해 주세요.';
    if (status === 401) return '로그인이 만료됐어요. 다시 로그인해 주세요.';
    if (status === 403) return '이 팀의 액션 플랜을 변경할 권한이 없어요.';
    if (status === 404)
      return '회의록 또는 액션 플랜이 삭제됐어요. 목록을 새로고침해 주세요.';
    if (!status || status >= 500)
      return '저장 결과를 확인할 수 없어요. 목록을 새로고침해 등록 여부를 확인해 주세요.';
  }
  return '액션 플랜을 저장하지 못했어요. 입력 내용을 확인하고 다시 시도해 주세요.';
}

export function isActionCreateUncertain(error: unknown) {
  return (
    !isAxiosError(error) || !error.response || error.response.status >= 500
  );
}
