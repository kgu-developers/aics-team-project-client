export type DocumentAccessState = {
  /** The document is submitted and every area is read only. */
  isSubmitted: boolean;
  /** The lock query itself failed, so ownership is unknown. */
  isLockUnavailable?: boolean;
  /** Someone else holds the section lock. */
  lockedByOther?: boolean;
  /** Display name of the current lock owner, when the server exposes it. */
  ownerName?: string | null;
  /** This editor is in write mode and owns the lock. */
  isEditing?: boolean;
  /** Write access was granted and is still valid. */
  canEdit?: boolean;
};

/**
 * One wording for every document editor: say that writing is blocked first,
 * then who holds the area, so "편집 중" never reads as "내가 편집 중".
 */
export function documentAccessMessage(state: DocumentAccessState) {
  if (state.isSubmitted)
    return '제출한 문서예요. 내용은 읽기 전용으로 확인할 수 있어요.';
  if (state.isLockUnavailable)
    return '편집 권한을 확인하지 못했어요. 입력 내용을 유지한 채 다시 확인해 주세요.';
  if (state.lockedByOther)
    return `지금은 수정할 수 없어요. ${
      state.ownerName?.trim() ? `${state.ownerName.trim()} 님이` : '다른 팀원이'
    } 편집 중입니다. 편집이 끝난 뒤 다시 열어 주세요.`;
  if (state.isEditing && !state.canEdit)
    return '편집 권한이 만료됐어요. 입력 내용은 유지되며, 권한을 다시 확인한 뒤 저장할 수 있어요.';
  if (state.canEdit)
    return '편집 중입니다. 변경한 내용은 저장 버튼으로 저장해 주세요.';
  return '편집 권한을 확인하는 중이에요.';
}
