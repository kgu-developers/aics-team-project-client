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
import {
  AdminGeneralMessageTeamChecklist,
  ALL_TEAMS_RECIPIENT,
} from './AdminGeneralMessageTeamChecklist';

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
  teamId: string;
};

function readDraft(storageKey: string) {
  try {
    const stored = sessionStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as GeneralMessageDraft) : null;
  } catch {
    return null;
  }
}

function storeDraft({
  draftTeamStorageKey,
  message,
  selectedDraftTeamStorageKey,
  teamId,
}: {
  draftTeamStorageKey: string;
  message: string;
  selectedDraftTeamStorageKey: string;
  teamId: string;
}) {
  try {
    if (!message.trim()) {
      sessionStorage.removeItem(draftTeamStorageKey);
      if (teamId) {
        sessionStorage.setItem(selectedDraftTeamStorageKey, teamId);
      } else {
        sessionStorage.removeItem(selectedDraftTeamStorageKey);
      }
      return;
    }

    sessionStorage.setItem(
      draftTeamStorageKey,
      JSON.stringify({ message, teamId } satisfies GeneralMessageDraft),
    );
    sessionStorage.setItem(selectedDraftTeamStorageKey, teamId);
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
  const [teamId, setTeamId] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isBroadcastConfirmationOpen, setIsBroadcastConfirmationOpen] =
    useState(false);
  const currentUser = useAuthStore(state => state.currentUser);
  const teamsQuery = useAdminSectionTeamsQuery(isOpen ? sectionId : undefined);
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const submitSectionMutation = useSubmitSectionTeamMessageMutation(sectionId);
  const canBroadcast =
    !isTeamLocked &&
    Boolean(
      currentUser?.sections.some(
        section =>
          String(section.id) === sectionId && section.role === 'PROFESSOR',
      ),
    );
  // A restored draft may contain the sentinel after the user's role changed.
  // Never let a stale local value bypass the current professor-only UI policy.
  const isAllTeamsSelected = canBroadcast && teamId === ALL_TEAMS_RECIPIENT;
  const teams = teamsQuery.data?.contents ?? [];
  const hasSelectedTeam = useMemo(
    () => isAllTeamsSelected || teams.some(team => String(team.id) === teamId),
    [isAllTeamsSelected, teamId, teams],
  );
  const isSubmitPending =
    submitMutation.isPending || submitSectionMutation.isPending;

  const draftStorageKey = `${draftStoragePrefix}${sectionId}`;
  const draftTeamStorageKey = `${draftStorageKey}:team:${teamId || 'unselected'}`;
  const selectedDraftTeamStorageKey = `${draftStorageKey}:selected-team`;

  useEffect(() => {
    if (!isOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    const fallbackTeamId = initialTeamId ?? '';
    try {
      const storedTeamId =
        initialTeamId ??
        sessionStorage.getItem(selectedDraftTeamStorageKey) ??
        fallbackTeamId;
      const draft = readDraft(
        `${draftStorageKey}:team:${storedTeamId || 'unselected'}`,
      );
      setTeamId(initialTeamId ?? draft?.teamId ?? storedTeamId);
      setMessage(draft?.message ?? '');
    } catch {
      setTeamId(fallbackTeamId);
      setMessage('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDraftLoaded(true);
  }, [draftStorageKey, initialTeamId, isOpen, selectedDraftTeamStorageKey]);

  useEffect(() => {
    if (!isOpen || !isDraftLoaded) return;

    storeDraft({
      draftTeamStorageKey,
      message,
      selectedDraftTeamStorageKey,
      teamId,
    });
  }, [
    isDraftLoaded,
    isOpen,
    message,
    draftTeamStorageKey,
    selectedDraftTeamStorageKey,
    teamId,
  ]);

  if (!isOpen) return null;

  const handleTeamChange = (nextTeamId: string) => {
    storeDraft({
      draftTeamStorageKey,
      message,
      selectedDraftTeamStorageKey,
      teamId,
    });
    const nextDraft = readDraft(
      `${draftStorageKey}:team:${nextTeamId || 'unselected'}`,
    );
    setTeamId(nextTeamId);
    setMessage(nextDraft?.message ?? '');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const clearDraftAfterSend = () => {
    try {
      sessionStorage.removeItem(draftTeamStorageKey);
      if (sessionStorage.getItem(selectedDraftTeamStorageKey) === teamId)
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
    if (isAllTeamsSelected) {
      submitSectionMutation.mutate(
        { message: message.trim() },
        {
          onError,
          onSuccess: result => {
            setIsBroadcastConfirmationOpen(false);
            clearDraftAfterSend();
            setMessage('');
            setSuccessMessage(
              result.sentCount === 0
                ? '전송 대상 팀이 없습니다.'
                : `전체 ${result.sentCount}개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.`,
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
              isDisabled={isTeamLocked}
              onChange={handleTeamChange}
              sectionId={sectionId}
              teamId={teamId}
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
