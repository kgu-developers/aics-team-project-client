import type { MeetingActionStatus } from '@aics/core';
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
import { useEffect } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import {
  AdminMeetingActionTable,
  AdminTeamActivityTabs,
} from '~/features/admin-meeting/components';
import { useAdminSectionMeetingActionsQuery } from '~/features/admin-meeting/queries';
import AdminSectionTeamFilter, {
  ALL_TEAMS,
} from '~/features/admin-section/components/AdminSectionTeamFilter';

import * as styles from './AdminMeetingActionsPage.css';

const pageSize = 10;

const statusOptions = [
  { label: '전체 상태', value: '' },
  { label: '시작 전', value: 'TODO' },
  { label: '진행 중', value: 'IN_PROGRESS' },
  { label: '완료', value: 'DONE' },
];

function toStatusFilter(
  value: string | undefined,
): MeetingActionStatus | undefined {
  return value === 'TODO' || value === 'IN_PROGRESS' || value === 'DONE'
    ? value
    : undefined;
}

export default function AdminMeetingActionsPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/meeting-actions' }) as {
    page?: number;
    sectionId?: number | string;
    status?: string;
    teamId?: number | string;
  };
  const activeSectionsQuery = useActiveAdminSections();
  const sections = activeSectionsQuery.data;
  const requestedSectionId =
    search.sectionId === undefined ? undefined : String(search.sectionId);
  const isRequestedSectionAvailable = sections.some(
    section => section.id === requestedSectionId,
  );
  const selectedSectionId = isRequestedSectionAvailable
    ? requestedSectionId
    : sections[0]?.id;
  const selectedTeamId =
    isRequestedSectionAvailable && search.teamId !== undefined
      ? String(search.teamId)
      : '';
  const selectedStatus = toStatusFilter(search.status);
  const requestedPage = Number(search.page ?? 0);
  const selectedPage =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 0;
  const query = useAdminSectionMeetingActionsQuery(
    sections.map(section => section.id),
    selectedSectionId,
    {
      page: selectedPage,
      size: pageSize,
      status: selectedStatus,
      teamId: selectedTeamId || undefined,
    },
  );

  useEffect(() => {
    if (!selectedSectionId || requestedSectionId === selectedSectionId) return;

    void navigate({
      replace: true,
      search: { page: 0, sectionId: selectedSectionId },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }, [navigate, requestedSectionId, selectedSectionId]);

  function selectSection(sectionId: string) {
    void navigate({
      search: { page: 0, sectionId },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }

  function selectTeam(teamId: string) {
    if (!selectedSectionId) return;

    void navigate({
      search: {
        page: 0,
        sectionId: selectedSectionId,
        ...(teamId === ALL_TEAMS ? {} : { teamId }),
        ...(selectedStatus ? { status: selectedStatus } : {}),
      },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }

  function selectStatus(status: string) {
    if (!selectedSectionId) return;

    void navigate({
      search: {
        page: 0,
        sectionId: selectedSectionId,
        ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
        ...(status ? { status } : {}),
      },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }

  function selectPage(page: number) {
    if (!selectedSectionId) return;

    void navigate({
      search: {
        page,
        sectionId: selectedSectionId,
        ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
      },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }

  const actions = query.data?.contents ?? [];
  const pagination = query.data?.pageable;
  const boundedPage = pagination
    ? Math.max(0, Math.min(pagination.page, pagination.totalPages - 1))
    : selectedPage;

  useEffect(() => {
    if (!query.isSuccess || selectedPage === boundedPage) return;
    if (!selectedSectionId) return;

    void navigate({
      search: {
        page: boundedPage,
        sectionId: selectedSectionId,
        ...(selectedTeamId ? { teamId: selectedTeamId } : {}),
        ...(selectedStatus ? { status: selectedStatus } : {}),
      },
      to: ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }, [
    boundedPage,
    navigate,
    query.isSuccess,
    selectedPage,
    selectedSectionId,
    selectedStatus,
    selectedTeamId,
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.titleArea}>
        <Heading level={1}>액션플랜</Heading>
      </div>
      <AdminTeamActivityTabs
        activeView='actions'
        sectionId={selectedSectionId}
        teamId={selectedTeamId || undefined}
      />
      <AdminSectionTeamFilter
        allowAllSections={false}
        label='액션플랜 필터'
        onSectionChange={selectSection}
        onTeamChange={selectTeam}
        sectionId={selectedSectionId ?? ''}
        teamId={selectedTeamId}
      >
        <Selector
          isDisabled={activeSectionsQuery.isPending || !selectedSectionId}
          label='상태'
          onChange={selectStatus}
          options={statusOptions}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={selectedStatus ?? ''}
          width={180}
        />
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
      ) : sections.length === 0 ? (
        <EmptyState
          description='운영 중인 담당 분반이 없어 액션플랜을 조회할 수 없습니다.'
          title='표시할 액션플랜이 없습니다.'
        />
      ) : query.isPending || selectedPage !== boundedPage ? (
        <Text aria-live='polite' role='status'>
          액션플랜을 불러오는 중입니다.
        </Text>
      ) : query.isError ? (
        <EmptyState
          actions={
            <Button label='다시 시도' onClick={() => void query.refetch()} />
          }
          description='담당 분반의 액션플랜만 조회할 수 있습니다.'
          title='액션플랜을 불러오지 못했습니다.'
        />
      ) : (
        <Card className={styles.tableCard}>
          <AdminMeetingActionTable
            actions={actions}
            emptyMessage='조건에 맞는 액션플랜이 없습니다.'
          />
        </Card>
      )}
      {pagination && pagination.totalPages > 1 ? (
        <Pagination
          className={styles.pagination}
          isDisabled={query.isFetching}
          onChange={page => selectPage(page - 1)}
          page={boundedPage + 1}
          pageSize={pagination.size}
          totalPages={pagination.totalPages}
          variant='compact'
        />
      ) : null}
    </div>
  );
}
