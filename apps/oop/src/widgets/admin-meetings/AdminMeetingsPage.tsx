import {
  Button,
  Card,
  EmptyState,
  Heading,
  Pagination,
  Selector,
  SelectorOption,
  Text,
} from '@aics/design-system';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState, type KeyboardEvent } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import { AdminMeetingEditLogTable } from '~/features/admin-meeting/components';
import { formatAdminMeetingDateTime } from '~/features/admin-meeting/model';
import {
  useAdminMeetingRecordListQuery,
  useAdminSectionMeetingRecordLogsQuery,
} from '~/features/admin-meeting/queries';
import { useAdminMeetingReadState } from '~/features/admin-meeting-read/useAdminMeetingReadState';
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
  const [editLogPage, setEditLogPage] = useState(0);
  const currentUser = useAuthStore(state => state.currentUser);
  const { isRead } = useAdminMeetingReadState(currentUser?.id);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meetings/' }) as {
    page?: number;
    sectionId?: number | string;
    teamId?: number | string;
    milestoneId?: number | string;
  };
  const activeSectionsQuery = useActiveAdminSections();
  const accessibleSections = activeSectionsQuery.data;
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
    size: 10,
  });
  const editLogsQuery = useAdminSectionMeetingRecordLogsQuery(
    accessibleSectionIds,
    selectedSectionId === ALL_SECTIONS ? undefined : selectedSectionId,
    {
      page: editLogPage,
      size: 20,
      teamId: selectedTeamId,
    },
  );
  const records = query.data?.contents ?? [];
  const editLogs = editLogsQuery.data?.contents ?? [];
  const editLogPagination = editLogsQuery.data?.pageable;
  const boundedEditLogPage = editLogPagination
    ? Math.max(
        0,
        Math.min(editLogPagination.page, editLogPagination.totalPages - 1),
      )
    : editLogPage;

  useEffect(() => {
    setEditLogPage(0);
  }, [selectedSectionId, selectedTeamId]);

  useEffect(() => {
    if (!editLogsQuery.isSuccess || editLogPage === boundedEditLogPage) return;

    setEditLogPage(boundedEditLogPage);
  }, [boundedEditLogPage, editLogPage, editLogsQuery.isSuccess]);

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

      {activeSectionsQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          운영 중인 분반을 불러오는 중입니다.
        </Text>
      ) : activeSectionsQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='운영 중인 분반을 불러오지 못했습니다.'
        />
      ) : accessibleSectionIds.length === 0 ? (
        <EmptyState
          description='운영 중인 담당 분반이 없어 회의록을 조회할 수 없습니다.'
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
                <th scope='col'>분반</th>
                <th scope='col'>팀</th>
                <th scope='col'>회의 제목</th>
                <th scope='col'>작성 일자</th>
                <th scope='col'>작성자</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => {
                const openMeeting = () => {
                  void navigate({
                    params: { meetingId: String(record.id) },
                    to: ROUTES.ADMIN_MEETING_DETAIL,
                  });
                };

                return (
                  <tr
                    aria-label={`${record.title} 회의록 보기`}
                    className={styles.clickableRow}
                    key={record.id}
                    onClick={openMeeting}
                    onKeyDown={event => handleRowNavigation(event, openMeeting)}
                    tabIndex={0}
                  >
                    <td>{record.sectionName}</td>
                    <td>{record.teamName}</td>
                    <td>{record.title}</td>
                    <td>
                      {!isRead(record.id) ? <AdminUnreadDot /> : null}
                      {formatAdminMeetingDateTime(record.meetingAt)}
                    </td>
                    <td>{record.authorId}</td>
                  </tr>
                );
              })}
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
      {selectedSectionId !== ALL_SECTIONS ? (
        <section className={styles.editLogsSection}>
          <div className={styles.editLogsHeading}>
            <div>
              <Heading level={2}>회의록 수정 이력</Heading>
              <Text color='secondary'>
                선택한 분반과 팀 기준의 수정 사유를 최신순으로 확인합니다.
                {selectedMilestoneId
                  ? ' 마일스톤 필터는 회의록 목록에만 적용됩니다.'
                  : ''}
              </Text>
            </div>
          </div>
          {editLogsQuery.isPending || editLogPage !== boundedEditLogPage ? (
            <Text aria-live='polite' role='status'>
              수정 이력을 불러오는 중입니다.
            </Text>
          ) : editLogsQuery.isError ? (
            <EmptyState
              actions={
                <Button
                  label='다시 시도'
                  onClick={() => void editLogsQuery.refetch()}
                />
              }
              description='담당 분반의 회의록 수정 이력만 조회할 수 있습니다.'
              title='수정 이력을 불러오지 못했습니다.'
            />
          ) : (
            <Card className={styles.editLogsCard}>
              <AdminMeetingEditLogTable
                emptyMessage='조건에 맞는 회의록 수정 이력이 없습니다.'
                logs={editLogs}
              />
            </Card>
          )}
          {editLogPagination && editLogPagination.totalPages > 1 ? (
            <Pagination
              className={styles.pagination}
              isDisabled={editLogsQuery.isFetching}
              onChange={page => setEditLogPage(page - 1)}
              page={boundedEditLogPage + 1}
              pageSize={editLogPagination.size}
              totalPages={editLogPagination.totalPages}
              variant='compact'
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
