import {
  Button,
  Heading,
  Selector,
  SelectorOption,
  Text,
  TextArea,
} from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import {
  ADMIN_SECTION_FILTER_WIDTH,
  ADMIN_TEAM_FILTER_WIDTH,
} from '~/features/admin-section/filterLayout';
import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';
import { useSubmitTeamMessageMutation } from '~/features/team-message/queries';

import * as styles from './AdminGeneralMessageDialog.css';
import { useDraggableMessagePanel } from './useDraggableMessagePanel';

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
  const draggablePanel = useDraggableMessagePanel();
  const teamsQuery = useAdminSectionTeamsQuery(isOpen ? sectionId : undefined);
  const submitMutation = useSubmitTeamMessageMutation(teamId);
  const teams = teamsQuery.data?.contents ?? [];
  const hasSelectedTeam = useMemo(
    () => teams.some(team => String(team.id) === teamId),
    [teamId, teams],
  );

  const draftStorageKey = `${draftStoragePrefix}${sectionId}`;

  useEffect(() => {
    if (!isOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    const fallbackTeamId = initialTeamId ?? '';
    try {
      const stored = sessionStorage.getItem(draftStorageKey);
      const draft = stored ? (JSON.parse(stored) as GeneralMessageDraft) : null;
      setTeamId(initialTeamId ?? draft?.teamId ?? fallbackTeamId);
      setMessage(draft?.message ?? '');
    } catch {
      setTeamId(fallbackTeamId);
      setMessage('');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDraftLoaded(true);
  }, [draftStorageKey, initialTeamId, isOpen]);

  useEffect(() => {
    if (!isOpen || !isDraftLoaded) return;

    if (!message.trim()) {
      sessionStorage.removeItem(draftStorageKey);
      return;
    }

    sessionStorage.setItem(
      draftStorageKey,
      JSON.stringify({ message, teamId } satisfies GeneralMessageDraft),
    );
  }, [draftStorageKey, isDraftLoaded, isOpen, message, teamId]);

  if (!isOpen) return null;

  return (
    <aside
      aria-label='일반 메시지 작성 패널'
      className={styles.panel}
      onPointerDown={draggablePanel.handlePointerDown}
      onPointerMove={draggablePanel.handlePointerMove}
      onPointerUp={draggablePanel.handlePointerUp}
      ref={draggablePanel.panelRef}
      style={draggablePanel.panelStyle}
    >
      <div className={styles.content}>
        <div className={styles.panelHeader} data-panel-drag-handle>
          <Heading level={2}>일반 메시지 보내기</Heading>
          <Text color='secondary' type='supporting'>
            ⋮⋮ 이동
          </Text>
        </div>
        <div>
          <Text color='secondary'>
            {description ??
              '메시지를 받을 팀을 선택하세요. 보낸 메시지는 해당 팀의 일반 메시지 대화에 추가됩니다.'}
          </Text>
        </div>
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
          <Selector
            isDisabled={
              isTeamLocked || teamsQuery.isPending || teamsQuery.isError
            }
            label='팀'
            onChange={nextTeamId => {
              setTeamId(nextTeamId);
              setSuccessMessage(null);
            }}
            options={[
              { label: '팀 선택', value: '' },
              ...teams.map(team => ({
                label: team.name,
                value: String(team.id),
              })),
            ]}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={teamId}
            width={ADMIN_TEAM_FILTER_WIDTH}
          />
          {teamsQuery.isError ? (
            <Text role='alert'>팀 목록을 불러오지 못했습니다.</Text>
          ) : null}
        </div>
        <TextArea
          aria-label='일반 메시지 내용'
          label='내용'
          onChange={value => {
            setMessage(value);
            if (errorMessage) setErrorMessage(null);
            if (successMessage) setSuccessMessage(null);
          }}
          placeholder='팀에 전달할 메시지를 입력하세요.'
          value={message}
        />
        {successMessage ? <Text role='status'>{successMessage}</Text> : null}
        {errorMessage ? <Text role='alert'>{errorMessage}</Text> : null}
        <div className={styles.actions}>
          <Button
            isDisabled={submitMutation.isPending}
            label='닫기'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            isDisabled={
              !hasSelectedTeam || !message.trim() || submitMutation.isPending
            }
            isLoading={submitMutation.isPending}
            label='보내기'
            onClick={() => {
              if (!hasSelectedTeam || !message.trim()) return;

              setErrorMessage(null);
              setSuccessMessage(null);
              submitMutation.mutate(
                { message: message.trim(), relatedType: 'GENERAL' },
                {
                  onError: () =>
                    setErrorMessage(
                      '일반 메시지를 보내지 못했습니다. 다시 시도해 주세요.',
                    ),
                  onSuccess: () => {
                    sessionStorage.removeItem(draftStorageKey);
                    setMessage('');
                    setSuccessMessage(
                      '일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
                    );
                    onSent?.();
                  },
                },
              );
            }}
          />
        </div>
      </div>
    </aside>
  );
}
