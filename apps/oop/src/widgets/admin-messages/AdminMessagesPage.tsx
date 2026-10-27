import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  Text,
  TextArea,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

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
import { useDraggableMessagePanel } from '~/features/team-message/components';
import { useSubmitTeamMessageMutation } from '~/features/team-message/queries';

import * as styles from './AdminMessagesPage.css';

const draftStorageKey = 'aics.oop.admin.general-message-draft:inbox';

type GeneralMessageDraft = {
  message: string;
  sectionId: string;
  teamId: string;
};

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const activeSectionsQuery = useActiveAdminSections();
  const sections = activeSectionsQuery.data;
  const [sectionId, setSectionId] = useState<string>();
  const [teamId, setTeamId] = useState<string>();
  const [page, setPage] = useState(0);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeSectionId, setComposeSectionId] = useState('');
  const [composeTeamId, setComposeTeamId] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeError, setComposeError] = useState<string | null>(null);
  const [composeSuccessMessage, setComposeSuccessMessage] = useState<
    string | null
  >(null);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const draggablePanel = useDraggableMessagePanel();
  const query = useAdminMessagesQuery(sectionId, page, teamId);
  const submitMutation = useSubmitTeamMessageMutation(composeTeamId);
  const readMutation = useUpdateAdminMessageReadMutation();
  const messages = useMemo(() => query.data?.contents ?? [], [query.data]);
  const pagination = query.data?.pageable;
  const boundedPage = pagination
    ? Math.max(0, Math.min(pagination.page, pagination.totalPages - 1))
    : page;
  useEffect(() => {
    if (query.isSuccess && page !== boundedPage) setPage(boundedPage);
  }, [boundedPage, page, query.isSuccess]);

  useEffect(() => {
    if (!isComposeOpen) {
      setIsDraftLoaded(false);
      return;
    }

    setIsDraftLoaded(false);
    try {
      const stored = sessionStorage.getItem(draftStorageKey);
      const draft = stored ? (JSON.parse(stored) as GeneralMessageDraft) : null;
      setComposeSectionId(
        draft?.sectionId ?? sectionId ?? sections[0]?.id ?? '',
      );
      setComposeTeamId(draft?.teamId ?? '');
      setComposeMessage(draft?.message ?? '');
    } catch {
      setComposeSectionId(sectionId ?? sections[0]?.id ?? '');
      setComposeTeamId('');
      setComposeMessage('');
    }
    setComposeError(null);
    setComposeSuccessMessage(null);
    setIsDraftLoaded(true);
  }, [isComposeOpen, sectionId, sections]);

  useEffect(() => {
    if (!isComposeOpen || !isDraftLoaded) return;

    if (!composeMessage.trim()) {
      sessionStorage.removeItem(draftStorageKey);
      return;
    }

    sessionStorage.setItem(
      draftStorageKey,
      JSON.stringify({
        message: composeMessage,
        sectionId: composeSectionId,
        teamId: composeTeamId,
      } satisfies GeneralMessageDraft),
    );
  }, [
    composeMessage,
    composeSectionId,
    composeTeamId,
    isComposeOpen,
    isDraftLoaded,
  ]);

  const selectSection = (nextSectionId?: string) => {
    setSectionId(nextSectionId);
    setTeamId(undefined);
    setPage(0);
  };

  const selectTeam = (nextTeamId?: string) => {
    setTeamId(nextTeamId);
    setPage(0);
  };

  const openMessageThread = (message: (typeof messages)[number]) => {
    if (!message.read) readMutation.mutate(message.id);
    void navigate({
      params: { teamId: String(message.teamId) },
      to: ROUTES.ADMIN_MESSAGE_TEAM,
    });
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
          onPageChange={setPage}
          page={boundedPage}
          pageCount={pagination.totalPages}
        />
      ) : null}
      {isComposeOpen ? (
        <aside
          aria-label='일반 메시지 작성 패널'
          className={styles.composePanel}
          onPointerDown={draggablePanel.handlePointerDown}
          onPointerMove={draggablePanel.handlePointerMove}
          onPointerUp={draggablePanel.handlePointerUp}
          ref={draggablePanel.panelRef}
          style={draggablePanel.panelStyle}
        >
          <div className={styles.composePanelContent}>
            <div className={styles.composePanelHeader} data-panel-drag-handle>
              <Heading level={2}>일반 메시지 보내기</Heading>
              <Text color='secondary' type='supporting'>
                ⋮⋮ 이동
              </Text>
            </div>
            <div>
              <Text color='secondary'>
                메시지를 받을 분반과 팀을 선택하세요. 보낸 메시지는 해당 팀의
                일반 메시지 대화에 추가됩니다.
              </Text>
            </div>
            <AdminSectionTeamFilter
              allowAllSections={false}
              allowAllTeams={false}
              label='일반 메시지 수신 팀'
              onSectionChange={next => {
                setComposeSectionId(next);
                setComposeTeamId('');
                setComposeSuccessMessage(null);
              }}
              onTeamChange={next => {
                setComposeTeamId(next);
                setComposeSuccessMessage(null);
              }}
              sectionId={composeSectionId}
              teamId={composeTeamId}
            />
            <TextArea
              aria-label='일반 메시지 내용'
              label='내용'
              onChange={value => {
                setComposeMessage(value);
                if (composeError) setComposeError(null);
                if (composeSuccessMessage) setComposeSuccessMessage(null);
              }}
              placeholder='팀에 전달할 메시지를 입력하세요.'
              value={composeMessage}
            />
            {composeSuccessMessage ? (
              <Text role='status'>{composeSuccessMessage}</Text>
            ) : null}
            {composeError ? <Text role='alert'>{composeError}</Text> : null}
            <div className={styles.composeActions}>
              <Button
                isDisabled={submitMutation.isPending}
                label='닫기'
                onClick={() => setIsComposeOpen(false)}
                variant='secondary'
              />
              <Button
                isDisabled={
                  !composeSectionId ||
                  !composeTeamId ||
                  !composeMessage.trim() ||
                  submitMutation.isPending
                }
                isLoading={submitMutation.isPending}
                label='보내기'
                onClick={() => {
                  if (!composeTeamId || !composeMessage.trim()) return;
                  setComposeError(null);
                  setComposeSuccessMessage(null);
                  submitMutation.mutate(
                    {
                      message: composeMessage.trim(),
                      relatedType: 'GENERAL',
                    },
                    {
                      onError: () =>
                        setComposeError(
                          '일반 메시지를 보내지 못했습니다. 다시 시도해 주세요.',
                        ),
                      onSuccess: () => {
                        sessionStorage.removeItem(draftStorageKey);
                        setComposeMessage('');
                        setComposeSuccessMessage(
                          '일반 메시지를 보냈습니다. 쪽지함에서 전송 내역을 확인할 수 있습니다.',
                        );
                        void query.refetch();
                      },
                    },
                  );
                }}
              />
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
