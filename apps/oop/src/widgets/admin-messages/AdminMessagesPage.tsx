import {
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  Text,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMessagesPage.css';

export default function AdminMessagesPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const sections = currentUser?.sections ?? [];
  const [sectionId, setSectionId] = useState<string>();
  const [page, setPage] = useState(0);
  const query = useAdminMessagesQuery(sectionId, page);
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
    setPage(0);
  };

  return (
    <div className={styles.page}>
      <div>
        <Heading level={1}>쪽지함</Heading>
        <Text>담당 분반의 팀 메시지를 확인하고 관리합니다.</Text>
        {query.data ? <Text>미확인 {query.data.unreadCount}건</Text> : null}
      </div>
      <div aria-label='분반 필터' className={styles.filters} role='group'>
        <button
          aria-pressed={!sectionId}
          className={!sectionId ? styles.filterActive : styles.filter}
          onClick={() => selectSection(undefined)}
          type='button'
        >
          전체
        </button>
        {sections.map(section => {
          const value = String(section.id);
          const active = sectionId === value;
          return (
            <button
              aria-pressed={active}
              className={active ? styles.filterActive : styles.filter}
              key={value}
              onClick={() => selectSection(value)}
              type='button'
            >
              {section.name ?? value}
            </button>
          );
        })}
      </div>
      {query.isLoading || page !== boundedPage ? (
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
                  <tr className={styles.messageRow} key={row.id}>
                    <td>
                      {row.read ? null : (
                        <span
                          aria-label='읽지 않음'
                          className={styles.unreadDot}
                        />
                      )}
                      {row.sectionName}
                    </td>
                    <td>
                      <Link
                        onClick={() => {
                          if (!row.read) readMutation.mutate(row.id);
                        }}
                        params={{ teamId: String(row.teamId) }}
                        to={ROUTES.ADMIN_MESSAGE_TEAM}
                      >
                        {row.teamName}
                      </Link>
                    </td>
                    <td>{row.senderName ?? row.senderId}</td>
                    <td>{row.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {pagination ? (
            <HStack gap={2} justify='end'>
              <Button
                label='이전 페이지'
                isDisabled={query.isFetching || page === 0}
                onClick={() => setPage(current => Math.max(0, current - 1))}
                variant='secondary'
              />
              <Text aria-live='polite'>
                {pagination.totalPages === 0 ? 0 : page + 1} /{' '}
                {pagination.totalPages} 페이지
              </Text>
              <Button
                label='다음 페이지'
                isDisabled={
                  query.isFetching ||
                  pagination.isEnd ||
                  page + 1 >= pagination.totalPages
                }
                onClick={() => setPage(current => current + 1)}
                variant='secondary'
              />
            </HStack>
          ) : null}
        </Card>
      )}
    </div>
  );
}
