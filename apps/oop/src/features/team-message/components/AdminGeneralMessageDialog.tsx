import { AlertDialog, Selector, SelectorOption } from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import { ADMIN_SECTION_FILTER_WIDTH } from '~/features/admin-section/filterLayout';
import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  useSubmitSectionTeamMessageMutation,
  useSubmitTeamMessageMutation,
} from '~/features/team-message/queries';

import { AdminGeneralMessageComposerPanel } from './AdminGeneralMessageComposerPanel';
import * as styles from './AdminGeneralMessageDialog.css';
import { AdminGeneralMessageTeamChecklist } from './AdminGeneralMessageTeamChecklist';

type AdminGeneralMessageDialogProps = {
  description?: string;
  initialTeamId?: string;
  isOpen: boolean;
  isTeamLocked?: boolean;
  onClose: () => void;
  onSent?: () => void;
  sectionId: string;
  sectionLabel: string;
};

const draftStoragePrefix = 'aics.oop.admin.general-message-draft:';
type GeneralMessageDraft = {
  message: string;
  teamId?: string;
  teamIds?: string[];
};

function normalizeTeamIds(teamIds: readonly string[]) {
  return [...new Set(teamIds.filter(Boolean))].sort();
}

function teamSelectionKey(teamIds: readonly string[]) {
  return normalizeTeamIds(teamIds).join(',') || 'unselected';
}

function readDraft(storageKey: string): GeneralMessageDraft | null {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return null;
    const draft = JSON.parse(stored) as GeneralMessageDraft;
    return {
      message: typeof draft.message === 'string' ? draft.message : '',
      teamIds: normalizeTeamIds(
        Array.isArray(draft.teamIds)
          ? draft.teamIds
          : draft.teamId
            ? [draft.teamId]
            : [],
      ),
    };
  } catch {
    return null;
  }
}

function readSelectedTeamIds(storageKey: string) {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as unknown;
    return normalizeTeamIds(
      Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'string' || typeof parsed === 'number'
          ? [String(parsed)]
          : [],
    );
  } catch {
    // Earlier drafts stored one recipient as a plain string.
    const legacyTeamId = sessionStorage.getItem(storageKey);
    return normalizeTeamIds(legacyTeamId ? [legacyTeamId] : []);
  }
}

function storeDraft({
  draftStorageKey,
  message,
  selectedDraftTeamStorageKey,
  teamIds,
}: {
  draftStorageKey: string;
  message: string;
  selectedDraftTeamStorageKey: string;
  teamIds: string[];
}) {
  try {
    const normalizedTeamIds = normalizeTeamIds(teamIds);
    if (!message.trim()) {
      sessionStorage.removeItem(draftStorageKey);
    } else {
      sessionStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          message,
          teamIds: normalizedTeamIds,
        } satisfies GeneralMessageDraft),
      );
    }

    if (normalizedTeamIds.length === 0) {
      sessionStorage.removeItem(selectedDraftTeamStorageKey);
    } else {
      sessionStorage.setItem(
        selectedDraftTeamStorageKey,
        JSON.stringify(normalizedTeamIds),
      );
    }
  } catch {
    // Draft persistence is best-effort and must not interrupt message writing.
  }
}

export function AdminGeneralMessageDialog({
  description,
  initialTeamId,
  isOpen,
  isTeamLocked = false,
  onClose,
  onSent,
  sectionId,
  sectionLabel,
}: AdminGeneralMessageDialogProps) {
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isBroadcastConfirmationOpen, setIsBroadcastConfirmationOpen] =
    useState(false);
  const currentUser = useAuthStore(state => state.currentUser);
  const teamsQuery = useAdminSectionTeamsQuery(isOpen ? sectionId : undefined);
  const canBroadcast =
    !isTeamLocked &&
    Boolean(
      currentUser?.sections.some(
        section =>
          String(section.id) === sectionId && section.role === 'PROFESSOR',
      ),
    );
  const teams = teamsQuery.data?.contents ?? [];
  const availableTeamIds = useMemo(
    () => teams.map(team => String(team.id)),
    [teams],
  );
  const selectedTeamIds = useMemo(
    () => teamIds.filter(teamId => availableTeamIds.includes(teamId)),
    [availableTeamIds, teamIds],
  );
  const isAllTeamsSelected =
    canBroadcast &&
    availableTeamIds.length > 0 &&
    availableTeamIds.every(teamId => selectedTeamIds.includes(teamId));
  const hasSelectedTeam = selectedTeamIds.length > 0;
  const submitMutation = useSubmitTeamMessageMutation(selectedTeamIds[0]);
  const submitSectionMutation = useSubmitSectionTeamMessageMutation(sectionId);
  const isSubmitPending =
    submitMutation.isPending || submitSectionMutation.isPending;

  const draftStorageKey = `${draftStoragePrefix}${sectionId}`;
  const draftTeamStorageKey = `${draftStorageKey}:team:${teamSelectionKey(teamIds)}`;
  const selectedDraftTeamStorageKey = `${draftStorageKey}:selected-team`;

  useEffect(() => {
    if (!isOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    const fallbackTeamIds = initialTeamId ? [initialTeamId] : [];
    try {
      const storedTeamIds = initialTeamId
        ? fallbackTeamIds
        : readSelectedTeamIds(selectedDraftTeamStorageKey);
      const draft = readDraft(
        `${draftStorageKey}:team:${teamSelectionKey(storedTeamIds)}`,
      );
      setTeamIds(
        initialTeamId ? fallbackTeamIds : (draft?.teamIds ?? storedTeamIds),
      );
      setMessage(draft?.message ?? '');
    } catch {
      setTeamIds(fallbackTeamIds);
      setMessage('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDraftLoaded(true);
  }, [draftStorageKey, initialTeamId, isOpen, selectedDraftTeamStorageKey]);

  useEffect(() => {
    if (!isOpen || !isDraftLoaded) return;

    storeDraft({
      draftStorageKey: draftTeamStorageKey,
      message,
      selectedDraftTeamStorageKey,
      teamIds,
    });
  }, [
    isDraftLoaded,
    isOpen,
    message,
    draftTeamStorageKey,
    selectedDraftTeamStorageKey,
    teamIds,
  ]);

  if (!isOpen) return null;

  const handleTeamChange = (nextTeamIds: string[]) => {
    const normalizedNextTeamIds = normalizeTeamIds(nextTeamIds);
    storeDraft({
      draftStorageKey: draftTeamStorageKey,
      message,
      selectedDraftTeamStorageKey,
      teamIds,
    });
    const nextDraft = readDraft(
      `${draftStorageKey}:team:${teamSelectionKey(normalizedNextTeamIds)}`,
    );
    setTeamIds(normalizedNextTeamIds);
    setMessage(nextDraft?.message ?? '');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleInvalidTeamIds = (nextTeamIds: string[]) => {
    // Keep the text when a persisted recipient was deleted or access changed.
    // Move it to the still-valid selection instead of discarding recipients
    // that remain available in the current section.
    const normalizedNextTeamIds = normalizeTeamIds(nextTeamIds);
    const nextDraftStorageKey = `${draftStorageKey}:team:${teamSelectionKey(normalizedNextTeamIds)}`;
    storeDraft({
      draftStorageKey: nextDraftStorageKey,
      message,
      selectedDraftTeamStorageKey,
      teamIds: normalizedNextTeamIds,
    });
    if (nextDraftStorageKey !== draftTeamStorageKey) {
      try {
        sessionStorage.removeItem(draftTeamStorageKey);
      } catch {
        // Draft persistence is best-effort and must not interrupt writing.
      }
    }
    setTeamIds(normalizedNextTeamIds);
    setSuccessMessage(null);
  };

  const clearDraftAfterSend = () => {
    try {
      sessionStorage.removeItem(draftTeamStorageKey);
      if (
        teamSelectionKey(readSelectedTeamIds(selectedDraftTeamStorageKey)) ===
        teamSelectionKey(teamIds)
      )
        sessionStorage.removeItem(selectedDraftTeamStorageKey);
    } catch {
      // Sending has succeeded even if the local draft cannot clear.
    }
  };

  const handleSend = () => {
    if (!hasSelectedTeam || !message.trim()) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    const onError = () => {
      setIsBroadcastConfirmationOpen(false);
      setErrorMessage('일반 메시지를 보내지 못했습니다. 다시 시도해 주세요.');
    };
    if (canBroadcast) {
      submitSectionMutation.mutate(
        {
          message: message.trim(),
          ...(isAllTeamsSelected
            ? {}
            : { teamIds: selectedTeamIds.map(teamId => Number(teamId)) }),
        },
        {
          onError,
          onSuccess: result => {
            setIsBroadcastConfirmationOpen(false);
            clearDraftAfterSend();
            setMessage('');
            setSuccessMessage(
              result.sentCount === 0
                ? '전송 대상 팀이 없습니다.'
                : `${isAllTeamsSelected ? '전체' : '선택한'} ${result.sentCount}개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.`,
            );
            onSent?.();
          },
        },
      );
      return;
    }
    submitMutation.mutate(
      { message: message.trim(), relatedType: 'GENERAL' },
      {
        onError,
        onSuccess: () => {
          clearDraftAfterSend();
          setMessage('');
          setSuccessMessage(
            '일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
          );
          onSent?.();
        },
      },
    );
  };

  return (
    <>
      <AdminGeneralMessageComposerPanel
        description={
          isAllTeamsSelected
            ? '분반의 삭제되지 않은 모든 팀에 같은 일반 메시지를 보냅니다.'
            : (description ??
              '메시지를 받을 팀을 선택하세요. 보낸 메시지는 해당 팀의 일반 메시지 대화에 추가됩니다.')
        }
        errorMessage={errorMessage}
        isSubmitDisabled={
          !hasSelectedTeam || !message.trim() || isSubmitPending
        }
        isSubmitPending={isSubmitPending}
        message={message}
        onClose={onClose}
        onMessageChange={value => {
          setMessage(value);
          if (errorMessage) setErrorMessage(null);
          if (successMessage) setSuccessMessage(null);
        }}
        onSend={() => {
          if (isAllTeamsSelected) {
            setIsBroadcastConfirmationOpen(true);
            return;
          }
          handleSend();
        }}
        recipientSelectors={
          <div className={styles.recipientSelectors}>
            <Selector
              isDisabled
              label='분반'
              onChange={() => undefined}
              options={[{ label: sectionLabel, value: sectionId }]}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={sectionId}
              width={ADMIN_SECTION_FILTER_WIDTH}
            />
            <AdminGeneralMessageTeamChecklist
              canBroadcast={canBroadcast}
              isDisabled={isTeamLocked || isSubmitPending}
              onChange={handleTeamChange}
              onInvalidTeamIds={handleInvalidTeamIds}
              sectionId={sectionId}
              teamIds={teamIds}
            />
          </div>
        }
        successMessage={successMessage}
      />
      <AlertDialog
        actionLabel='전체 팀에 보내기'
        cancelLabel='취소'
        description='선택한 분반의 삭제되지 않은 모든 팀에 같은 일반 메시지가 전송됩니다.'
        isActionLoading={submitSectionMutation.isPending}
        isOpen={isBroadcastConfirmationOpen}
        onAction={handleSend}
        onOpenChange={nextIsOpen => {
          if (!nextIsOpen && !submitSectionMutation.isPending) {
            setIsBroadcastConfirmationOpen(false);
          }
        }}
        title='분반 전체 팀에 메시지를 보낼까요?'
      />
    </>
  );
}
