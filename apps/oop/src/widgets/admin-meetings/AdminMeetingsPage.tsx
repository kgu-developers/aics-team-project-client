import {
  Card,
  EmptyState,
  Heading,
  Pagination,
  Selector,
  SelectorOption,
  Text,
} from '@aics/design-system';
import { useNavigate, useSearch } from '@tanstack/react-router';
import type { KeyboardEvent } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import { useAdminSectionMilestonesQuery } from '~/features/admin-milestone-review/queries';
import AdminSectionTeamFilter, {
  ALL_SECTIONS,
  ALL_TEAMS,
} from '~/features/admin-section/components/AdminSectionTeamFilter';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMeetingsPage.css';

function handleRowNavigation(
  event: KeyboardEvent<HTMLTableRowElement>,
  open: () => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  open();
}

export default function AdminMeetingsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meetings/' }) as {
    page?: number;
    sectionId?: number | string;
    teamId?: number | string;
    milestoneId?: number | string;
  };
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const requestedSectionId =
    search.sectionId === undefined ? undefined : String(search.sectionId);
  const requestedTeamId =
    search.teamId === undefined ? undefined : String(search.teamId);
  const requestedMilestoneId =
    search.milestoneId === undefined ? undefined : String(search.milestoneId);
  const selectedSectionId =
    requestedSectionId && accessibleSectionIds.includes(requestedSectionId)
      ? requestedSectionId
      : ALL_SECTIONS;
  const requestedPage = Number(search.page ?? 0);
  const selectedPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 0;
  const selectedMilestoneId =
    selectedSectionId === ALL_SECTIONS ? undefined : requestedMilestoneId;
  const selectedTeamId =
    selectedSectionId === ALL_SECTIONS ? undefined : requestedTeamId;
  const milestonesQuery = useAdminSectionMilestonesQuery(
    selectedSectionId === ALL_SECTIONS ? undefined : selectedSectionId,
  );
  const query = useAdminMeetingRecordListQuery(accessibleSectionIds, {
    page: selectedPage,
    sectionId:
      selectedSectionId === ALL_SECTIONS ? undefined : selectedSectionId,
    teamId: selectedTeamId,
    milestoneId: selectedMilestoneId,
    size: 20,
  });
  const records = query.data?.contents ?? [];

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === ALL_SECTIONS ? {} : { sectionId, page: 0 },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  function selectMilestone(milestoneId: string) {
    void navigate({
      search: {
        ...(selectedSectionId === ALL_SECTIONS
          ? {}
          : { sectionId: selectedSectionId }),
        ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        page: 0,
      },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  function selectTeam(teamId: string) {
    void navigate({
      search: {
        sectionId: selectedSectionId,
        ...(teamId !== ALL_TEAMS ? { teamId } : {}),
        ...(selectedMilestoneId ? { milestoneId: selectedMilestoneId } : {}),
        page: 0,
      },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  function selectPage(page: number) {
    void navigate({
      search: {
        ...(selectedSectionId === ALL_SECTIONS
          ? {}
          : { sectionId: selectedSectionId }),
        ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
        ...(selectedMilestoneId ? { milestoneId: selectedMilestoneId } : {}),
        page,
      },
      to: ROUTES.ADMIN_MEETINGS,
    });
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>회의록</Heading>
      <AdminSectionTeamFilter
        onSectionChange={selectSection}
        onTeamChange={selectTeam}
        sectionId={selectedSectionId}
        teamId={selectedTeamId ?? ALL_TEAMS}
      >
        {selectedSectionId !== ALL_SECTIONS ? (
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
      </AdminSectionTeamFilter>

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
                <tr
                  aria-label={`${record.title} 회의록 보기`}
                  className={styles.clickableRow}
                  key={record.id}
                  onClick={() =>
                    void navigate({
                      params: { meetingId: String(record.id) },
                      to: ROUTES.ADMIN_MEETING_DETAIL,
                    })
                  }
                  onKeyDown={event =>
                    handleRowNavigation(
                      event,
                      () =>
                        void navigate({
                          params: { meetingId: String(record.id) },
                          to: ROUTES.ADMIN_MEETING_DETAIL,
                        }),
                    )
                  }
                  tabIndex={0}
                >
                  <td>{formatSeoulDateTime(record.meetingAt)}</td>
                  <td>{record.sectionName}</td>
                  <td>{record.teamName}</td>
                  <td>{record.title}</td>
                  <td>{record.authorId}</td>
                  <td>{record.participantCount}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {query.data && query.data.pageable.totalPages > 1 ? (
        <Pagination
          className={styles.pagination}
          isDisabled={query.isFetching}
          onChange={page => selectPage(page - 1)}
          page={selectedPage + 1}
          pageSize={query.data.pageable.size}
          totalPages={query.data.pageable.totalPages}
          variant='compact'
        />
      ) : null}
    </div>
  );
}
