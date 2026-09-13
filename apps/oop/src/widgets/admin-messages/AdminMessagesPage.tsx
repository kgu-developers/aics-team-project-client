import { Card, Heading, Text } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMessagesPage.css';

export default function AdminMessagesPage() {
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  const [sectionId, setSectionId] = useState<string>();
  const query = useAdminMessagesQuery(sectionId);
  const readMutation = useUpdateAdminMessageReadMutation();
  const navigate = useNavigate();
  const messages = useMemo(() => query.data?.contents ?? [], [query.data]);

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
          onClick={() => setSectionId(undefined)}
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
              onClick={() => setSectionId(value)}
              type='button'
            >
              {section.name ?? value}
            </button>
          );
        })}
      </div>
      {query.isLoading ? (
        <Text>불러오는 중...</Text>
      ) : (
        <Card className={styles.tableCard}>
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
                  className={styles.messageRow}
                  key={row.id}
                  onClick={async () => {
                    if (!row.read) await readMutation.mutateAsync(row.id);
                    await navigate({
                      params: { teamId: String(row.teamId) },
                      to: ROUTES.ADMIN_MESSAGE_TEAM,
                    });
                  }}
                >
                  <td>
                    {row.read ? null : (
                      <span
                        aria-label='읽지 않음'
                        className={styles.unreadDot}
                      />
                    )}
                    {row.sectionName}
                  </td>
                  <td>{row.teamName}</td>
                  <td>{row.senderName ?? row.senderId}</td>
                  <td>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
