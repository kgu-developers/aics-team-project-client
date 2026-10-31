import {
  AlertDialog,
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Text,
} from '@aics/design-system';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatAdminSectionLabel } from '~/shared/lib/formatAdminSectionLabel';
import { formatTeamMessageRelatedType } from '~/shared/lib/formatTeamMessageRelatedType';
import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import AdminSectionTeamFilter, {
  ALL_SECTIONS,
  ALL_TEAMS,
} from '~/features/admin-section/components/AdminSectionTeamFilter';
import { useAuthStore } from '~/features/auth/authStore';
import {
  AdminGeneralMessageComposerPanel,
  AdminGeneralMessageTeamChecklist,
  ALL_TEAMS_RECIPIENT,
} from '~/features/team-message/components';
import {
  useSubmitSectionTeamMessageMutation,
  useSubmitTeamMessageMutation,
} from '~/features/team-message/queries';

import * as styles from './AdminMessagesPage.css';

const draftStorageKey = 'aics.oop.admin.general-message-draft:inbox';
const selectedRecipientStorageKey = `${draftStorageKey}:selected-recipient`;
type GeneralMessageDraft = {
  message: string;
  sectionId: string;
  teamId: string;
};

function composeDraftStorageKey(sectionId: string, teamId: string) {
  return `${draftStorageKey}:section:${sectionId || 'unselected'}:team:${teamId || 'unselected'}`;
}

function readComposeDraft(storageKey: string) {
  try {
    const stored = sessionStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as GeneralMessageDraft) : null;
  } catch {
    return null;
  }
}

function readSelectedRecipient() {
  try {
    const stored = sessionStorage.getItem(selectedRecipientStorageKey);
    return stored
      ? (JSON.parse(stored) as Pick<
          GeneralMessageDraft,
          'sectionId' | 'teamId'
        >)
      : null;
  } catch {
    return null;
  }
}

function storeComposeDraft(draft: GeneralMessageDraft) {
  try {
    const storageKey = composeDraftStorageKey(draft.sectionId, draft.teamId);
    if (!draft.message.trim()) {
      sessionStorage.removeItem(storageKey);
    } else {
      sessionStorage.setItem(storageKey, JSON.stringify(draft));
    }
    if (!draft.sectionId && !draft.teamId) {
      sessionStorage.removeItem(selectedRecipientStorageKey);
      return;
    }
    sessionStorage.setItem(
      selectedRecipientStorageKey,
      JSON.stringify({
        sectionId: draft.sectionId,
        teamId: draft.teamId,
      }),
    );
  } catch {
    // Draft persistence is best-effort and must not interrupt message writing.
  }
}

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/messages/' }) as {
    page?: number;
    sectionId?: number;
    teamId?: number;
  };
  const initialPage = Number(search.page ?? 0);
  const currentUser = useAuthStore(state => state.currentUser);
  const activeSectionsQuery = useActiveAdminSections();
  const sections = activeSectionsQuery.data;
  const sectionId =
    search.sectionId === undefined ? undefined : String(search.sectionId);
  const teamId =
    search.teamId === undefined ? undefined : String(search.teamId);
  const page =
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 0;
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState('');
  const [composeTeamId, setComposeTeamId] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccessMessage, setComposeSuccessMessage] = useState<
    string | null
  >(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isBroadcastConfirmationOpen, setIsBroadcastConfirmationOpen] =
    useState(false);
  const composeDefaultsRef = useRef({ sectionId, sections });
  const query = useAdminMessagesQuery(sectionId, page, teamId);
  const submitMutation = useSubmitTeamMessageMutation(composeTeamId);
  const submitSectionMutation =
    useSubmitSectionTeamMessageMutation(composeSectionId);
  const readMutation = useUpdateAdminMessageReadMutation();
  const messages = useMemo(() => query.data?.contents ?? [], [query.data]);
  const pagination = query.data?.pageable;
  const boundedPage = pagination
    ? Math.max(0, Math.min(pagination.page, pagination.totalPages - 1))
    : page;
  const canBroadcast = Boolean(
    currentUser?.sections.some(
      section =>
        String(section.id) === composeSectionId && section.role === 'PROFESSOR',
    ),
  );
  // A restored draft can outlive a role change, so the sentinel alone must not
  // enable a section-wide request.
  const isAllTeamsSelected =
    canBroadcast && composeTeamId === ALL_TEAMS_RECIPIENT;
  const isSubmitPending =
    submitMutation.isPending || submitSectionMutation.isPending;
  useEffect(() => {
    if (!query.isSuccess || page === boundedPage) return;

    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
        ...(boundedPage > 0 ? { page: boundedPage } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  }, [boundedPage, navigate, page, query.isSuccess, sectionId, teamId]);

  useEffect(() => {
    composeDefaultsRef.current = { sectionId, sections };
  }, [sectionId, sections]);

  useEffect(() => {
    if (!isComposeOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    const { sectionId: selectedSectionId, sections: activeSections } =
      composeDefaultsRef.current;
    const selectedRecipient = readSelectedRecipient();
    const fallbackSectionId = selectedSectionId ?? activeSections[0]?.id ?? '';
    const storedSectionId = selectedRecipient?.sectionId ?? fallbackSectionId;
    const storedTeamId = selectedRecipient?.teamId ?? '';
    const draft =
      readComposeDraft(composeDraftStorageKey(storedSectionId, storedTeamId)) ??
      readComposeDraft(draftStorageKey);
    try {
      setComposeSectionId(draft?.sectionId ?? storedSectionId);
      setComposeTeamId(draft?.teamId ?? storedTeamId);
      setComposeMessage(draft?.message ?? '');
    } catch {
      setComposeSectionId(selectedSectionId ?? activeSections[0]?.id ?? '');
      setComposeTeamId('');
      setComposeMessage('');
    }
    setComposeError(null);
    setComposeSuccessMessage(null);
    setIsDraftLoaded(true);
  }, [isComposeOpen]);

  useEffect(() => {
    if (!isComposeOpen || !isDraftLoaded) return;

    storeComposeDraft({
      message: composeMessage,
      sectionId: composeSectionId,
      teamId: composeTeamId,
    });
  }, [
    composeMessage,
    composeSectionId,
    composeTeamId,
    isComposeOpen,
    isDraftLoaded,
  ]);

  const selectSection = (nextSectionId?: string) => {
    void navigate({
      search: nextSectionId ? { sectionId: Number(nextSectionId) } : {},
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const selectTeam = (nextTeamId?: string) => {
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(nextTeamId ? { teamId: Number(nextTeamId) } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const selectPage = (nextPage: number) => {
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
        ...(nextPage > 0 ? { page: nextPage } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const openMessageThread = (message: (typeof messages)[number]) => {
    if (!message.read) readMutation.mutate(message.id);
    void navigate({
      params: { teamId: String(message.teamId) },
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
        ...(page > 0 ? { page } : {}),
      },
      to: ROUTES.ADMIN_MESSAGE_TEAM,
    });
  };

  const clearComposeDraftAfterSend = () => {
    try {
      sessionStorage.removeItem(
        composeDraftStorageKey(composeSectionId, composeTeamId),
      );
      const selectedRecipient = readSelectedRecipient();
      if (
        selectedRecipient?.sectionId === composeSectionId &&
        selectedRecipient.teamId === composeTeamId
      ) {
        sessionStorage.removeItem(selectedRecipientStorageKey);
      }
    } catch {
      // Sending has succeeded even if the local draft cannot clear.
    }
  };

  const submitComposeMessage = () => {
    if (!composeSectionId || !composeTeamId || !composeMessage.trim()) return;

    setComposeError(null);
    setComposeSuccessMessage(null);
    const onError = () => {
      setIsBroadcastConfirmationOpen(false);
      setComposeError('일반 메시지를 보내지 못했습니다. 다시 시도해 주세요.');
    };
    if (isAllTeamsSelected) {
      submitSectionMutation.mutate(
        { message: composeMessage.trim() },
        {
          onError,
          onSuccess: result => {
            setIsBroadcastConfirmationOpen(false);
            clearComposeDraftAfterSend();
            setComposeMessage('');
            setComposeSuccessMessage(
              result.sentCount === 0
                ? '전송 대상 팀이 없습니다.'
                : `전체 ${result.sentCount}개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.`,
            );
            void query.refetch();
          },
        },
      );
      return;
    }
    submitMutation.mutate(
      {
        message: composeMessage.trim(),
        relatedType: 'GENERAL',
      },
      {
        onError,
        onSuccess: () => {
          clearComposeDraftAfterSend();
          setComposeMessage('');
          setComposeSuccessMessage(
            '일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
          );
          void query.refetch();
        },
      },
    );
  };

  return (
    <div className={styles.page}>
      <Heading level={1}>쪽지함</Heading>
      <AdminSectionTeamFilter
        onSectionChange={next =>
          selectSection(next === ALL_SECTIONS ? undefined : next)
        }
        onTeamChange={next => selectTeam(next === ALL_TEAMS ? undefined : next)}
        sectionId={sectionId ?? ALL_SECTIONS}
        teamId={teamId}
      >
        <div className={styles.filterAction}>
          <Button
            isDisabled={!sections.length}
            label='일반 메시지 보내기'
            onClick={() => {
              setIsComposeOpen(true);
            }}
          />
        </div>
      </AdminSectionTeamFilter>
      {activeSectionsQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          운영 중인 분반을 불러오는 중입니다.
        </Text>
      ) : activeSectionsQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='운영 중인 분반을 불러오지 못했습니다.'
        />
      ) : query.isLoading || page !== boundedPage ? (
        <Text>불러오는 중...</Text>
      ) : query.isError ? (
        <Card className={styles.tableCard}>
          <Text>쪽지함을 불러오지 못했습니다.</Text>
          <Button label='다시 시도' onClick={() => void query.refetch()} />
        </Card>
      ) : (
        <Card className={styles.tableCard}>
          {messages.length === 0 ? (
            <EmptyState title='쪽지가 없습니다.' />
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th
                    aria-label='읽음 상태'
                    className={styles.readStateColumn}
                    scope='col'
                  />
                  <th className={styles.sectionColumn}>분반</th>
                  <th className={styles.teamColumn}>팀</th>
                  <th>내용</th>
                  <th className={styles.senderColumn}>발신자</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(row => {
                  const section = sections.find(
                    item => String(item.id) === String(row.sectionId),
                  );
                  const relatedTypeLabel = formatTeamMessageRelatedType(
                    row.relatedType,
                  );

                  return (
                    <tr
                      aria-label={`${row.teamName} 쪽지 상세 보기`}
                      className={styles.messageRow}
                      key={row.id}
                      onClick={() => openMessageThread(row)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          openMessageThread(row);
                        }
                      }}
                      tabIndex={0}
                    >
                      <td className={styles.readStateColumn}>
                        {row.read ? (
                          <span className={styles.visuallyHidden}>읽음</span>
                        ) : (
                          <AdminUnreadDot />
                        )}
                      </td>
                      <td className={styles.sectionColumn}>
                        <span className={styles.sectionContext}>
                          <span
                            className={styles.metadataText}
                            title={
                              section
                                ? formatAdminSectionLabel(section)
                                : row.sectionName
                            }
                          >
                            {section
                              ? formatAdminSectionLabel(section)
                              : row.sectionName}
                          </span>
                          <span className={styles.typeBadge}>
                            <Badge label={relatedTypeLabel} variant='neutral' />
                          </span>
                        </span>
                      </td>
                      <td className={styles.teamColumn}>
                        <span
                          className={styles.metadataText}
                          title={row.teamName}
                        >
                          {row.teamName}
                        </span>
                      </td>
                      <td>
                        <span
                          className={styles.messagePreview}
                          title={row.message}
                        >
                          {row.message}
                        </span>
                      </td>
                      <td className={styles.senderColumn}>
                        <span
                          className={styles.metadataText}
                          title={row.senderName ?? row.senderId}
                        >
                          {row.senderName ?? row.senderId}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}
      {!activeSectionsQuery.isPending &&
      !activeSectionsQuery.isError &&
      pagination &&
      pagination.totalPages > 1 ? (
        <ListPagination
          isDisabled={query.isFetching}
          label='쪽지함 페이지 이동'
          onPageChange={selectPage}
          page={boundedPage}
          pageCount={pagination.totalPages}
        />
      ) : null}
      {isComposeOpen ? (
        <AdminGeneralMessageComposerPanel
          description={
            isAllTeamsSelected
              ? '분반의 삭제되지 않은 모든 팀에 같은 일반 메시지를 보냅니다.'
              : '메시지를 받을 분반과 팀을 선택하세요. 보낸 메시지는 해당 팀의 일반 메시지 대화에 추가됩니다.'
          }
          errorMessage={composeError}
          isSubmitDisabled={
            !composeSectionId ||
            !composeTeamId ||
            !composeMessage.trim() ||
            isSubmitPending
          }
          isSubmitPending={isSubmitPending}
          message={composeMessage}
          onClose={() => setIsComposeOpen(false)}
          onMessageChange={value => {
            setComposeMessage(value);
            if (composeError) setComposeError(null);
            if (composeSuccessMessage) setComposeSuccessMessage(null);
          }}
          onSend={() => {
            if (isAllTeamsSelected) {
              setIsBroadcastConfirmationOpen(true);
              return;
            }
            submitComposeMessage();
          }}
          recipientSelectors={
            <AdminSectionTeamFilter
              allowAllSections={false}
              label='일반 메시지 수신 팀'
              onSectionChange={next => {
                storeComposeDraft({
                  message: composeMessage,
                  sectionId: composeSectionId,
                  teamId: composeTeamId,
                });
                setComposeSectionId(next);
                setComposeTeamId('');
                setComposeMessage('');
                setComposeSuccessMessage(null);
              }}
              sectionId={composeSectionId}
            >
              <AdminGeneralMessageTeamChecklist
                canBroadcast={canBroadcast}
                onChange={next => {
                  storeComposeDraft({
                    message: composeMessage,
                    sectionId: composeSectionId,
                    teamId: composeTeamId,
                  });
                  const nextDraft = readComposeDraft(
                    composeDraftStorageKey(composeSectionId, next),
                  );
                  setComposeTeamId(next);
                  setComposeMessage(nextDraft?.message ?? '');
                  setComposeSuccessMessage(null);
                }}
                sectionId={composeSectionId}
                teamId={composeTeamId}
              />
            </AdminSectionTeamFilter>
          }
          successMessage={composeSuccessMessage}
        />
      ) : null}
      <AlertDialog
        actionLabel='전체 팀에 보내기'
        cancelLabel='취소'
        description='선택한 분반의 삭제되지 않은 모든 팀에 같은 일반 메시지가 전송됩니다.'
        isActionLoading={submitSectionMutation.isPending}
        isOpen={isBroadcastConfirmationOpen}
        onAction={submitComposeMessage}
        onOpenChange={nextIsOpen => {
          if (!nextIsOpen && !submitSectionMutation.isPending) {
            setIsBroadcastConfirmationOpen(false);
          }
        }}
        title='분반 전체 팀에 메시지를 보낼까요?'
      />
    </div>
  );
}
