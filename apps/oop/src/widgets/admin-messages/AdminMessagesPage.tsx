import {
  Button,
  Card,
  EmptyState,
  Heading,
  Pagination,
  Text,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { getSectionDisplayLabel } from '~/shared/lib/getSectionDisplayLabel';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import AdminSectionTeamFilter, {
  ALL_SECTIONS,
  ALL_TEAMS,
} from '~/features/admin-section/components/AdminSectionTeamFilter';

import * as styles from './AdminMessagesPage.css';

export default function AdminMessagesPage() {
  const navigate = useNavigate();
  const activeSectionsQuery = useActiveAdminSections();
  const sections = activeSectionsQuery.data;
  const [sectionId, setSectionId] = useState<string>();
  const [teamId, setTeamId] = useState<string>();
  const [page, setPage] = useState(0);
  const query = useAdminMessagesQuery(sectionId, page, teamId);
  const readMutation = useUpdateAdminMessageReadMutation();
  const messages = useMemo(() => query.data?.contents ?? [], [query.data]);
  const pagination = query.data?.pageable;
  const boundedPage = pagination
    ? Math.max(0, Math.min(pagination.page, pagination.totalPages - 1))
    : page;
  useEffect(() => {
    if (query.isSuccess && page !== boundedPage) setPage(boundedPage);
  }, [boundedPage, page, query.isSuccess]);

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
      <div>
        <Heading level={1}>쪽지함</Heading>
        <Text>담당 분반의 팀 메시지를 확인하고 관리합니다.</Text>
        {!activeSectionsQuery.isPending &&
        !activeSectionsQuery.isError &&
        query.data ? (
          <Text>미확인 {query.data.unreadCount}건</Text>
        ) : null}
      </div>
      <AdminSectionTeamFilter
        onSectionChange={next =>
          selectSection(next === ALL_SECTIONS ? undefined : next)
        }
        onTeamChange={next => selectTeam(next === ALL_TEAMS ? undefined : next)}
        sectionId={sectionId ?? ALL_SECTIONS}
        teamId={teamId}
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
                  <th>분반</th>
                  <th>팀</th>
                  <th>발신자</th>
                  <th>내용</th>
                </tr>
              </thead>
              <tbody>
                {messages.map(row => (
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
                    <td>
                      {row.read ? null : (
                        <span
                          aria-label='읽지 않음'
                          className={styles.unreadDot}
                        />
                      )}
                      {getSectionDisplayLabel(
                        sections,
                        row.sectionId,
                        row.sectionName,
                      )}
                    </td>
                    <td>{row.teamName}</td>
                    <td>{row.senderName ?? row.senderId}</td>
                    <td>{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
      {!activeSectionsQuery.isPending &&
      !activeSectionsQuery.isError &&
      pagination &&
      pagination.totalPages > 1 ? (
        <Pagination
          className={styles.pagination}
          isDisabled={query.isFetching}
          onChange={nextPage => setPage(nextPage - 1)}
          page={boundedPage + 1}
          pageSize={pagination.size}
          totalPages={pagination.totalPages}
          variant='compact'
        />
      ) : null}
    </div>
  );
}
