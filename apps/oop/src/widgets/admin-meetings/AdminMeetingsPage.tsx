import {
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import { useAdminSectionMilestonesQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMeetingsPage.css';

const allSectionsValue = 'all';

function formatDate(value: string) {
  return value.replace('T', ' ');
}

export default function AdminMeetingsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meetings/' }) as {
    page?: number;
    sectionId?: string;
    teamId?: string;
    milestoneId?: string;
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
  const selectedMilestoneId =
    selectedSectionId === allSectionsValue ? undefined : search.milestoneId;
  const milestonesQuery = useAdminSectionMilestonesQuery(
    selectedSectionId === allSectionsValue ? undefined : selectedSectionId,
  );
  const query = useAdminMeetingRecordListQuery(accessibleSectionIds, {
    page: selectedPage,
    sectionId:
      selectedSectionId === allSectionsValue ? undefined : selectedSectionId,
    teamId: search.teamId,
    milestoneId: selectedMilestoneId,
    size: 20,
  });
  const records = query.data?.contents ?? [];

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId, page: 0 },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  function selectMilestone(milestoneId: string) {
    void navigate({
      search: {
        ...(selectedSectionId === allSectionsValue
          ? {}
          : { sectionId: selectedSectionId }),
        ...(search.teamId ? { teamId: search.teamId } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        page: 0,
      },
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
        ...(selectedMilestoneId ? { milestoneId: selectedMilestoneId } : {}),
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
      {selectedSectionId !== allSectionsValue ? (
        <Selector
          label='마일스톤 필터'
          onChange={selectMilestone}
          options={[
            { label: '전체 마일스톤', value: '' },
            ...(milestonesQuery.data?.content ?? []).map(milestone => ({
              label: `${milestone.weekNumber}주차 · ${milestone.title}`,
              value: String(milestone.id),
            })),
          ]}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={selectedMilestoneId ?? ''}
          width={320}
        />
      ) : null}

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
                <th scope='col'>회의 제목</th>
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
                  <td>
                    <Link
                      className={styles.recordLink}
                      params={{ meetingId: String(record.id) }}
                      to={ROUTES.ADMIN_MEETING_DETAIL}
                    >
                      {record.title}
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
