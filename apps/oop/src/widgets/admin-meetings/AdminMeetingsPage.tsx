import { Card, EmptyState, Heading, Text } from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMeetingRecordsQuery } from '~/features/admin-meeting/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMeetingsPage.css';

const allSectionsValue = 'all';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export default function AdminMeetingsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meetings/' }) as {
    sectionId?: string;
  };
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const selectedSectionId =
    search.sectionId && accessibleSectionIds.includes(search.sectionId)
      ? search.sectionId
      : allSectionsValue;
  const query = useAdminMeetingRecordsQuery(accessibleSectionIds);

  const records = (query.data?.records ?? []).filter(
    record =>
      selectedSectionId === allSectionsValue ||
      record.sectionId === selectedSectionId,
  );

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>회의록</Heading>
      <div className={styles.filters} role='group' aria-label='분반 필터'>
        {[
          { label: '전체', value: allSectionsValue },
          ...accessibleSections.map(section => ({
            label: section.code,
            value: section.id,
          })),
        ].map(section => (
          <button
            aria-pressed={selectedSectionId === section.value}
            className={
              selectedSectionId === section.value
                ? styles.filterActive
                : styles.filter
            }
            key={section.value}
            onClick={() => selectSection(section.value)}
            type='button'
          >
            {section.label}
          </button>
        ))}
      </div>

      {accessibleSectionIds.length === 0 ? (
        <EmptyState
          description='담당 분반이 없어 회의록을 조회할 수 없습니다.'
          title='표시할 회의록이 없습니다.'
        />
      ) : query.isPending ? (
        <Text aria-live='polite' role='status'>
          회의록을 불러오는 중입니다.
        </Text>
      ) : query.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='회의록을 불러오지 못했습니다.'
        />
      ) : records.length === 0 ? (
        <EmptyState
          description='선택한 분반에 등록된 회의록이 없습니다.'
          title='표시할 회의록이 없습니다.'
        />
      ) : (
        <Card className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>작성 일자</th>
                <th>분반</th>
                <th>팀</th>
                <th>제목</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td>{formatDate(record.createdAt)}</td>
                  <td>{record.sectionLabel}</td>
                  <td>{record.teamLabel}</td>
                  <td>
                    <Link
                      className={styles.titleLink}
                      params={{ meetingId: record.id }}
                      search={{ sectionId: record.sectionId }}
                      to={ROUTES.ADMIN_MEETING_DETAIL}
                    >
                      {record.title}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
