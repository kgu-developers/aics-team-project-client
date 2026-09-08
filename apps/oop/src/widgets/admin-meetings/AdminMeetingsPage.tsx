import {
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMeetingsPage.css';

const allSectionsValue = 'all';
const phaseLabel = {
  FINAL: '최종',
  MID_CHECK: '중간 점검',
  PROPOSAL: '제안',
} as const;

function formatDate(value: string) {
  return value.replace('T', ' ');
}

function getContentPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim();

  return normalized.length > 60
    ? `${normalized.slice(0, 60)}…`
    : normalized || '작성된 회의 내용이 없습니다.';
}

export default function AdminMeetingsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meetings/' }) as {
    page?: number;
    sectionId?: string;
    teamId?: string;
  };
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const selectedSectionId =
    search.sectionId && accessibleSectionIds.includes(search.sectionId)
      ? search.sectionId
      : allSectionsValue;
  const requestedPage = Number(search.page ?? 0);
  const selectedPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 0;
  const query = useAdminMeetingRecordListQuery(accessibleSectionIds, {
    page: selectedPage,
    sectionId:
      selectedSectionId === allSectionsValue ? undefined : selectedSectionId,
    teamId: search.teamId,
    size: 20,
  });
  const records = query.data?.contents ?? [];

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId, page: 0 },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  function selectPage(page: number) {
    void navigate({
      search: {
        ...(selectedSectionId === allSectionsValue
          ? {}
          : { sectionId: selectedSectionId }),
        ...(search.teamId ? { teamId: search.teamId } : {}),
        page,
      },
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
          description='등록된 회의록이 없습니다.'
          title='표시할 회의록이 없습니다.'
        />
      ) : (
        <Card className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope='col'>회의 일시</th>
                <th scope='col'>분반</th>
                <th scope='col'>팀</th>
                <th scope='col'>단계</th>
                <th scope='col'>회의 내용</th>
                <th scope='col'>작성자</th>
                <th scope='col'>참석</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id}>
                  <td>{formatDate(record.meetingAt)}</td>
                  <td>{record.sectionName}</td>
                  <td>{record.teamName}</td>
                  <td>{phaseLabel[record.phase]}</td>
                  <td>
                    <Link
                      className={styles.recordLink}
                      params={{ meetingId: String(record.id) }}
                      to={ROUTES.ADMIN_MEETING_DETAIL}
                    >
                      {getContentPreview(record.content)}
                    </Link>
                  </td>
                  <td>{record.authorId}</td>
                  <td>{record.participantCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {query.data && query.data.pageable.totalPages > 1 ? (
        <HStack justify='end' gap={2}>
          <Button
            isDisabled={selectedPage === 0}
            label='이전 페이지'
            onClick={() => selectPage(selectedPage - 1)}
            type='button'
            variant='secondary'
          />
          <Text aria-live='polite'>
            {selectedPage + 1} / {query.data.pageable.totalPages}
          </Text>
          <Button
            isDisabled={query.data.pageable.isEnd}
            label='다음 페이지'
            onClick={() => selectPage(selectedPage + 1)}
            type='button'
            variant='secondary'
          />
        </HStack>
      ) : null}
    </div>
  );
}
