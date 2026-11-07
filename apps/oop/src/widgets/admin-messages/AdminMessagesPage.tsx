import {
  AlertDialog,
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Icon,
  Text,
  TextInput,
} from '@aics/design-system';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Inbox } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatAdminSectionLabel } from '~/shared/lib/formatAdminSectionLabel';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
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
import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  AdminGeneralMessageComposerPanel,
  AdminGeneralMessageTeamChecklist,
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
  teamId?: string;
  teamIds?: string[];
};

type AdminMessageSortDirection = 'ASC' | 'DESC';

function normalizeTeamIds(teamIds: readonly string[]) {
  return [...new Set(teamIds.filter(Boolean))].sort();
}

function teamSelectionKey(teamIds: readonly string[]) {
  return normalizeTeamIds(teamIds).join(',') || 'unselected';
}

function composeDraftStorageKey(sectionId: string, teamIds: readonly string[]) {
  return `${draftStorageKey}:section:${sectionId || 'unselected'}:team:${teamSelectionKey(teamIds)}`;
}

function readComposeDraft(storageKey: string) {
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return null;
    const draft = JSON.parse(stored) as GeneralMessageDraft;
    return {
      ...draft,
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

function readSelectedRecipient() {
  try {
    const stored = sessionStorage.getItem(selectedRecipientStorageKey);
    return stored
      ? (JSON.parse(stored) as Pick<
          GeneralMessageDraft,
          'sectionId' | 'teamId' | 'teamIds'
        >)
      : null;
  } catch {
    return null;
  }
}

function storeComposeDraft(draft: GeneralMessageDraft) {
  try {
    const teamIds = normalizeTeamIds(
      Array.isArray(draft.teamIds)
        ? draft.teamIds
        : draft.teamId
          ? [draft.teamId]
          : [],
    );
    const storageKey = composeDraftStorageKey(draft.sectionId, teamIds);
    if (!draft.message.trim()) {
      sessionStorage.removeItem(storageKey);
    } else {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ ...draft, teamIds } satisfies GeneralMessageDraft),
      );
    }
    if (!draft.sectionId && teamIds.length === 0) {
      sessionStorage.removeItem(selectedRecipientStorageKey);
      return;
    }
    sessionStorage.setItem(
      selectedRecipientStorageKey,
      JSON.stringify({
        sectionId: draft.sectionId,
        teamIds,
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
    senderKeyword?: string;
    sort?: AdminMessageSortDirection;
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
  const senderKeyword = search.senderKeyword ?? '';
  const sort = search.sort ?? 'DESC';
  const page =
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 0;
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState('');
  const [composeTeamIds, setComposeTeamIds] = useState<string[]>([]);
  const [composeMessage, setComposeMessage] = useState('');
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccessMessage, setComposeSuccessMessage] = useState<
    string | null
  >(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [isBroadcastConfirmationOpen, setIsBroadcastConfirmationOpen] =
    useState(false);
  const [senderKeywordInput, setSenderKeywordInput] = useState(senderKeyword);
  const composeDefaultsRef = useRef({ sectionId });
  const query = useAdminMessagesQuery(
    sectionId,
    page,
    teamId,
    senderKeyword,
    sort,
  );
  const submitMutation = useSubmitTeamMessageMutation(composeTeamIds[0]);
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
  const composeTeamsQuery = useAdminSectionTeamsQuery(
    isComposeOpen ? composeSectionId : undefined,
  );
  const availableComposeTeamIds = useMemo(
    () => (composeTeamsQuery.data?.contents ?? []).map(team => String(team.id)),
    [composeTeamsQuery.data?.contents],
  );
  const selectedComposeTeamIds = useMemo(
    () =>
      composeTeamIds.filter(teamId => availableComposeTeamIds.includes(teamId)),
    [availableComposeTeamIds, composeTeamIds],
  );
  const isAllTeamsSelected =
    canBroadcast &&
    availableComposeTeamIds.length > 0 &&
    availableComposeTeamIds.every(teamId =>
      selectedComposeTeamIds.includes(teamId),
    );
  const isSubmitPending =
    submitMutation.isPending || submitSectionMutation.isPending;
  useEffect(() => {
    if (!query.isSuccess || page === boundedPage) return;

    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
        ...(boundedPage > 0 ? { page: boundedPage } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  }, [
    boundedPage,
    navigate,
    page,
    query.isSuccess,
    sectionId,
    senderKeyword,
    sort,
    teamId,
  ]);

  useEffect(() => {
    composeDefaultsRef.current = { sectionId };
  }, [sectionId]);

  useEffect(() => {
    setSenderKeywordInput(senderKeyword);
  }, [senderKeyword]);

  useEffect(() => {
    if (!isComposeOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    const { sectionId: selectedSectionId } = composeDefaultsRef.current;
    const selectedRecipient = readSelectedRecipient();
    // The inbox filter is the explicit recipient context. Do not let an old
    // draft switch a message opened from a specific section to another one.
    // When the list is on "전체 분반", leave the recipient empty instead of
    // silently choosing the first assigned section.
    const storedSectionId = selectedSectionId ?? '';
    const storedTeamIds =
      selectedRecipient?.sectionId === storedSectionId
        ? normalizeTeamIds(
            Array.isArray(selectedRecipient.teamIds)
              ? selectedRecipient.teamIds
              : selectedRecipient.teamId
                ? [selectedRecipient.teamId]
                : [],
          )
        : [];
    const draft = storedSectionId
      ? readComposeDraft(composeDraftStorageKey(storedSectionId, storedTeamIds))
      : null;
    try {
      setComposeSectionId(draft?.sectionId ?? storedSectionId);
      setComposeTeamIds(draft?.teamIds ?? storedTeamIds);
      setComposeMessage(draft?.message ?? '');
    } catch {
      setComposeSectionId(selectedSectionId ?? '');
      setComposeTeamIds([]);
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
      teamIds: composeTeamIds,
    });
  }, [
    composeMessage,
    composeSectionId,
    composeTeamIds,
    isComposeOpen,
    isDraftLoaded,
  ]);

  const selectSection = (nextSectionId?: string) => {
    void navigate({
      search: {
        ...(nextSectionId ? { sectionId: Number(nextSectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const selectTeam = (nextTeamId?: string) => {
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
        ...(nextTeamId ? { teamId: Number(nextTeamId) } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const selectPage = (nextPage: number) => {
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
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
        ...(message.targetTeamCount && message.targetTeamCount > 1
          ? { messageId: message.id }
          : {}),
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
        ...(page > 0 ? { page } : {}),
      },
      to: ROUTES.ADMIN_MESSAGE_TEAM,
    });
  };

  const submitSenderKeyword = () => {
    const nextSenderKeyword = senderKeywordInput.trim();
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(nextSenderKeyword ? { senderKeyword: nextSenderKeyword } : {}),
        ...(sort === 'ASC' ? { sort } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const selectSort = (nextSort: AdminMessageSortDirection) => {
    void navigate({
      search: {
        ...(sectionId ? { sectionId: Number(sectionId) } : {}),
        ...(senderKeyword ? { senderKeyword } : {}),
        ...(nextSort === 'ASC' ? { sort: nextSort } : {}),
        ...(teamId ? { teamId: Number(teamId) } : {}),
      },
      to: ROUTES.ADMIN_MESSAGES,
    });
  };

  const clearComposeDraftAfterSend = () => {
    try {
      sessionStorage.removeItem(
        composeDraftStorageKey(composeSectionId, composeTeamIds),
      );
      const selectedRecipient = readSelectedRecipient();
      if (
        selectedRecipient?.sectionId === composeSectionId &&
        teamSelectionKey(
          Array.isArray(selectedRecipient.teamIds)
            ? selectedRecipient.teamIds
            : selectedRecipient.teamId
              ? [selectedRecipient.teamId]
              : [],
        ) === teamSelectionKey(composeTeamIds)
      ) {
        sessionStorage.removeItem(selectedRecipientStorageKey);
      }
    } catch {
      // Sending has succeeded even if the local draft cannot clear.
    }
  };

  const submitComposeMessage = () => {
    if (
      !composeSectionId ||
      selectedComposeTeamIds.length === 0 ||
      !composeMessage.trim()
    )
      return;

    setComposeError(null);
    setComposeSuccessMessage(null);
    const onError = () => {
      setIsBroadcastConfirmationOpen(false);
      setComposeError('일반 메시지를 보내지 못했습니다. 다시 시도해 주세요.');
    };
    if (canBroadcast) {
      submitSectionMutation.mutate(
        {
          message: composeMessage.trim(),
          ...(isAllTeamsSelected
            ? {}
            : {
                teamIds: selectedComposeTeamIds.map(teamId => Number(teamId)),
              }),
        },
        {
          onError,
          onSuccess: result => {
            setIsBroadcastConfirmationOpen(false);
            clearComposeDraftAfterSend();
            setComposeMessage('');
            setComposeSuccessMessage(
              result.sentCount === 0
                ? '전송 대상 팀이 없습니다.'
                : `${isAllTeamsSelected ? '전체' : '선택한'} ${result.sentCount}개 팀에 일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.`,
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
      <div className={styles.pageHeading}>
        <Icon icon={Inbox} size='lg' />
        <Heading level={1}>쪽지함</Heading>
      </div>
      <AdminSectionTeamFilter
        onSectionChange={next =>
          selectSection(next === ALL_SECTIONS ? undefined : next)
        }
        onTeamChange={next => selectTeam(next === ALL_TEAMS ? undefined : next)}
        sectionId={sectionId ?? ALL_SECTIONS}
        teamId={teamId}
        toolbar={
          <div className={styles.messageToolbar}>
            <form
              className={styles.senderSearch}
              onSubmit={event => {
                event.preventDefault();
                submitSenderKeyword();
              }}
            >
              <TextInput
                label='발신자 검색'
                onChange={setSenderKeywordInput}
                placeholder='이름 또는 학번 검색'
                value={senderKeywordInput}
                width='100%'
              />
              <Button label='검색' type='submit' variant='secondary' />
            </form>
            <div className={styles.filterAction}>
              <Button
                isDisabled={!sections.length}
                label='일반 메시지 보내기'
                onClick={() => {
                  setIsComposeOpen(true);
                }}
              />
            </div>
          </div>
        }
      />
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
                  <th
                    aria-sort={sort === 'DESC' ? 'descending' : 'ascending'}
                    className={styles.createdAtColumn}
                    scope='col'
                  >
                    <Button
                      className={styles.dateSortButton}
                      label={
                        sort === 'DESC'
                          ? '작성 일시 · 최신순 ↓'
                          : '작성 일시 · 오래된순 ↑'
                      }
                      onClick={() =>
                        selectSort(sort === 'DESC' ? 'ASC' : 'DESC')
                      }
                      size='sm'
                      variant='ghost'
                    />
                  </th>
                  <th className={styles.sectionColumn}>분반</th>
                  <th className={styles.teamColumn}>팀</th>
                  <th className={styles.leaderColumn}>팀장</th>
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
                  const targetTeamCount = row.targetTeamCount ?? 1;
                  const isBroadcast = targetTeamCount > 1;
                  const teamLabel = isBroadcast
                    ? `${targetTeamCount}개 팀`
                    : row.teamName;
                  const additionalTeamCount = Math.max(targetTeamCount - 1, 0);
                  const messageThreadLabel = isBroadcast
                    ? `${row.teamName} 팀 외 ${additionalTeamCount}개 팀 발송 상세 보기`
                    : `${row.teamName} 쪽지 상세 보기`;

                  return (
                    <tr
                      aria-label={messageThreadLabel}
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
                      <td className={styles.createdAtColumn}>
                        <time dateTime={row.createdAt}>
                          {formatSeoulDateTime(row.createdAt)}
                        </time>
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
                        {isBroadcast ? (
                          <span className={styles.broadcastTeamContext}>
                            <span
                              className={styles.metadataText}
                              title={row.teamName}
                            >
                              {row.teamName} 팀
                            </span>
                            <span
                              className={styles.broadcastTeamCount}
                              title={`${row.teamName} 팀 외 ${additionalTeamCount}개 팀 전송`}
                            >
                              외 {additionalTeamCount}개 팀 전송
                            </span>
                          </span>
                        ) : (
                          <span
                            className={styles.metadataText}
                            title={row.teamName}
                          >
                            {teamLabel}
                          </span>
                        )}
                      </td>
                      <td className={styles.leaderColumn}>
                        {isBroadcast ? (
                          <span
                            aria-label='복수 팀 발송에는 팀장 정보를 표시하지 않습니다.'
                            className={styles.metadataText}
                          >
                            -
                          </span>
                        ) : (
                          <span
                            className={styles.metadataText}
                            title={row.leaderName ?? '-'}
                          >
                            {row.leaderName ?? '-'}
                          </span>
                        )}
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
            selectedComposeTeamIds.length === 0 ||
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
                  teamIds: composeTeamIds,
                });
                const nextDraft = readComposeDraft(
                  composeDraftStorageKey(next, []),
                );
                setComposeSectionId(next);
                setComposeTeamIds(nextDraft?.teamIds ?? []);
                setComposeMessage(nextDraft?.message ?? '');
                setComposeSuccessMessage(null);
              }}
              isDisabled={isSubmitPending}
              sectionId={composeSectionId}
              sectionSelection='selector'
            >
              {composeSectionId ? (
                <AdminGeneralMessageTeamChecklist
                  canBroadcast={canBroadcast}
                  isDisabled={isSubmitPending}
                  onChange={next => {
                    storeComposeDraft({
                      message: composeMessage,
                      sectionId: composeSectionId,
                      teamIds: composeTeamIds,
                    });
                    const nextDraft = readComposeDraft(
                      composeDraftStorageKey(composeSectionId, next),
                    );
                    setComposeTeamIds(next);
                    setComposeMessage(nextDraft?.message ?? '');
                    setComposeSuccessMessage(null);
                  }}
                  onInvalidTeamIds={nextTeamIds => {
                    // A stored recipient can become invalid after its team is
                    // deleted. Preserve the typed message for the remaining
                    // valid recipients and prevent only the stale ID from
                    // being submitted.
                    const normalizedNextTeamIds = normalizeTeamIds(nextTeamIds);
                    const previousDraftStorageKey = composeDraftStorageKey(
                      composeSectionId,
                      composeTeamIds,
                    );
                    const nextDraftStorageKey = composeDraftStorageKey(
                      composeSectionId,
                      normalizedNextTeamIds,
                    );
                    storeComposeDraft({
                      message: composeMessage,
                      sectionId: composeSectionId,
                      teamIds: normalizedNextTeamIds,
                    });
                    if (previousDraftStorageKey !== nextDraftStorageKey) {
                      try {
                        sessionStorage.removeItem(previousDraftStorageKey);
                      } catch {
                        // Draft persistence is best-effort while composing.
                      }
                    }
                    setComposeTeamIds(normalizedNextTeamIds);
                    setComposeSuccessMessage(null);
                  }}
                  sectionId={composeSectionId}
                  teamIds={composeTeamIds}
                />
              ) : null}
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
