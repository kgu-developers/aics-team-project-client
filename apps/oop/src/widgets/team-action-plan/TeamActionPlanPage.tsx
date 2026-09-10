import type { MeetingActionStatus, TeamMeetingAction } from '@aics/core';
import {
  Button,
  Card,
  EmptyState,
  Heading,
  IconButton,
  proportional,
  Selector,
  StatusDot,
  Table,
  Text,
  Tooltip,
  type StatusDotVariant,
  type TableColumn,
  useToast,
} from '@aics/design-system';
import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import MeetingActionDeleteDialog from '~/features/meeting/MeetingActionDeleteDialog';
import MeetingActionFormDialog, {
  type ActionFormState,
} from '~/features/meeting/MeetingActionFormDialog';
import {
  actionDueDate,
  actionSaveError,
  isActionCreateUncertain,
} from '~/features/meeting/model/actionPlan';
import {
  useTeamActionPlanQuery,
  useSubmitMeetingActionMutation,
  useUpdateMeetingActionMutation,
} from '~/features/meeting/queries';

import * as styles from './TeamActionPlanPage.css';

type ActionStatusFilter = 'ALL' | MeetingActionStatus;

type ActionRow = TeamMeetingAction;

const statusLabels: Record<MeetingActionStatus, string> = {
  TODO: '시작 전',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
};

const statusOrder: Record<MeetingActionStatus, number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  DONE: 2,
};

const statusDotVariants: Record<MeetingActionStatus, StatusDotVariant> = {
  TODO: 'neutral',
  IN_PROGRESS: 'accent',
  DONE: 'success',
};

const statusFilterOptions = [
  { label: '전체', value: 'ALL' },
  { label: statusLabels.TODO, value: 'TODO' },
  { label: statusLabels.IN_PROGRESS, value: 'IN_PROGRESS' },
  { label: statusLabels.DONE, value: 'DONE' },
];

export default function TeamActionPlanPage() {
  const data = useTeamActionPlanQuery();
  return <TeamActionPlanContent key={data.teamId ?? 'no-team'} data={data} />;
}

function TeamActionPlanContent({
  data,
}: {
  data: ReturnType<typeof useTeamActionPlanQuery>;
}) {
  const { team, records, actions: rows } = data;
  const submitActionMutation = useSubmitMeetingActionMutation();
  const updateActionMutation = useUpdateMeetingActionMutation();
  const toast = useToast();
  const [deletingAction, setDeletingAction] = useState<ActionRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<ActionStatusFilter>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [dialogMode, setDialogMode] = useState<'add' | 'edit' | null>(null);
  const [editingAction, setEditingAction] = useState<ActionRow | null>(null);
  const [form, setForm] = useState<ActionFormState>({
    assigneeUserId: '',
    content: '',
    dueDate: '',
    meetingId: '',
  });

  const [uncertainCreate, setUncertainCreate] = useState(false);
  const filteredRows = useMemo(
    () =>
      rows
        .filter(row => {
          const statusMatches =
            statusFilter === 'ALL' || row.status === statusFilter;
          const assigneeMatches =
            assigneeFilter === 'ALL' ||
            (assigneeFilter === 'UNASSIGNED'
              ? row.assignee === null
              : row.assignee?.userId === assigneeFilter);

          return statusMatches && assigneeMatches;
        })
        .sort(
          (left, right) => statusOrder[left.status] - statusOrder[right.status],
        ),
    [assigneeFilter, rows, statusFilter],
  );
  const isPending =
    updateActionMutation.isPending || submitActionMutation.isPending;

  const closeDialog = () => {
    setDialogMode(null);
    setEditingAction(null);
    setForm({
      assigneeUserId: '',
      content: '',
      dueDate: '',
      meetingId: records[0]?.id ?? '',
    });
  };

  const openAddDialog = () => {
    setDialogMode('add');
    setForm({
      assigneeUserId: '',
      content: '',
      dueDate: '',
      meetingId: records[0]?.id ?? '',
    });
  };

  const openEditDialog = (row: ActionRow) => {
    setDialogMode('edit');
    setEditingAction(row);
    setForm({
      assigneeUserId: row.assignee?.userId ?? '',
      content: row.content,
      dueDate: actionDueDate(row.dueDate),
      meetingId: row.meetingRecord.id,
    });
  };

  const submitDialog = () => {
    if (!team || isPending || (dialogMode === 'add' && uncertainCreate)) return;
    if (dialogMode === 'edit' && editingAction) {
      updateActionMutation.mutate(
        {
          actionId: editingAction.id,
          input: {
            content: form.content.trim(),
            ...(form.assigneeUserId !== (editingAction.assignee?.userId ?? '')
              ? { assigneeUserId: form.assigneeUserId || null }
              : {}),
            ...(form.dueDate !== actionDueDate(editingAction.dueDate)
              ? { dueDate: form.dueDate || null }
              : {}),
          },
          meetingId: editingAction.meetingRecord.id,
          teamId: team.id,
        },
        {
          onError: error =>
            toast({ body: actionSaveError(error), type: 'error' }),
          onSuccess: () => {
            toast({ body: '액션 플랜을 수정했어요.' });
            closeDialog();
          },
        },
      );
      return;
    }

    submitActionMutation.mutate(
      {
        input: {
          assigneeUserId: form.assigneeUserId || null,
          content: form.content,
          dueDate: form.dueDate || null,
        },
        meetingId: form.meetingId,
        teamId: team.id,
      },
      {
        onError: error => {
          toast({ body: actionSaveError(error), type: 'error' });
          setUncertainCreate(isActionCreateUncertain(error));
        },
        onSuccess: () => {
          toast({ body: '액션 플랜을 추가했어요.' });
          closeDialog();
        },
      },
    );
  };

  const changeStatus = (row: ActionRow, status: MeetingActionStatus) => {
    if (!team || isPending || status === row.status) return;
    updateActionMutation.mutate(
      {
        actionId: row.id,
        input: { status },
        meetingId: row.meetingRecord.id,
        teamId: team.id,
      },
      {
        onError: error =>
          toast({ body: actionSaveError(error), type: 'error' }),
        onSuccess: () => toast({ body: '액션 플랜 상태를 변경했어요.' }),
      },
    );
  };

  const columns = useMemo<TableColumn<ActionRow>[]>(
    () => [
      {
        header: '기한',
        key: 'dueDate',
        renderCell: row => (
          <div className={styles.cell}>
            <span>{actionDueDate(row.dueDate) || '미정'}</span>
          </div>
        ),
        width: proportional(1.1, { minWidth: 0 }),
      },
      {
        header: '액션 항목',
        key: 'content',
        renderCell: row => (
          <div className={styles.cell}>
            <Tooltip
              content={`회의록: ${row.meetingRecord.title}`}
              hasHoverIndication={false}
            >
              <a
                className={styles.actionText}
                href={`${ROUTES.STUDENT.MEETINGS}/${row.meetingRecord.id}`}
              >
                {row.content}
              </a>
            </Tooltip>
            <span
              aria-label={`기한 ${actionDueDate(row.dueDate) || '미정'}, 담당자 ${row.assignee?.name ?? '미정'}`}
              className={styles.mobileActionMeta}
            >
              {actionDueDate(row.dueDate) || '미정'} ·{' '}
              {row.assignee?.name ?? '미정'}
            </span>
          </div>
        ),
        width: proportional(3.2, { minWidth: 0 }),
      },
      {
        header: '담당자',
        key: 'assignee',
        renderCell: row => (
          <div className={styles.cell}>
            <span>{row.assignee?.name ?? '미정'}</span>
          </div>
        ),
        width: proportional(1.1, { minWidth: 0 }),
      },
      {
        header: '상태',
        key: 'status',
        renderCell: row => (
          <div className={styles.cell}>
            <Selector
              isDisabled={isPending}
              isLabelHidden
              label={`${row.content} 상태`}
              onChange={status =>
                changeStatus(row, status as MeetingActionStatus)
              }
              options={Object.entries(statusLabels).map(([value, label]) => ({
                icon: (
                  <StatusDot
                    label={`${label} 상태`}
                    variant={statusDotVariants[value as MeetingActionStatus]}
                  />
                ),
                label,
                value,
              }))}
              startIcon={
                <StatusDot
                  label={`${statusLabels[row.status]} 상태`}
                  variant={statusDotVariants[row.status]}
                />
              }
              value={row.status}
              width='100%'
            />
          </div>
        ),
        width: proportional(1.8, { minWidth: 0 }),
      },
      {
        header: '관리',
        key: 'actions',
        renderCell: row => (
          <div className={styles.cell}>
            <span className={styles.desktopEditButton}>
              <Button
                isDisabled={isPending}
                label='수정'
                onClick={() => openEditDialog(row)}
                size='sm'
                variant='secondary'
              />
              <Button
                isDisabled={isPending}
                label='삭제'
                size='sm'
                variant='secondary'
                onClick={() => setDeletingAction(row)}
              />
            </span>
            <span className={styles.mobileEditButton}>
              <IconButton
                isDisabled={isPending}
                icon={<Pencil aria-hidden='true' size={16} />}
                label={`${row.content} 수정`}
                onClick={() => openEditDialog(row)}
                size='sm'
                variant='ghost'
              />
              <IconButton
                isDisabled={isPending}
                icon={<Trash2 aria-hidden='true' size={16} />}
                label={row.content + ' 삭제'}
                onClick={() => setDeletingAction(row)}
                size='sm'
                variant='ghost'
              />
            </span>
          </div>
        ),
        width: proportional(1.4, { minWidth: 0 }),
      },
    ],
    [team, toast, updateActionMutation, isPending],
  );

  if (!data.teamId) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 배정 후 팀 액션 플랜을 확인할 수 있어요.'
          title='소속 팀이 없어요.'
        />
      </div>
    );
  }

  if (data.isPending && !data.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 액션 플랜을 불러오는 중이에요.'
          title='잠시만 기다려 주세요.'
        />
      </div>
    );
  }

  if (data.isError || !team) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 액션 플랜 또는 팀원 정보를 불러오지 못했어요.'
          title='다시 시도해 주세요.'
        />
        <Button
          label='다시 시도'
          isDisabled={!data.canRetry}
          onClick={() => void data.refetch()}
          variant='secondary'
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <Heading level={1}>팀 액션 플랜</Heading>
          <Text color='secondary'>
            모든 회의록의 액션 플랜을 한곳에서 확인하고 관리합니다.
          </Text>
        </div>
        <Button
          isDisabled={
            data.recordsPending ||
            data.recordsError ||
            records.length === 0 ||
            isPending ||
            uncertainCreate
          }
          label='액션 플랜 추가'
          onClick={openAddDialog}
          variant='primary'
        />
      </div>
      {data.recordsError ? (
        <div role='alert'>
          <Text>회의록 목록을 불러오지 못해 액션 플랜을 추가할 수 없어요.</Text>
          <Button
            label='회의록 다시 불러오기'
            isDisabled={!data.canRetry}
            onClick={() => void data.refetch()}
            variant='secondary'
          />
        </div>
      ) : !data.recordsPending && records.length === 0 ? (
        <Text color='secondary'>
          액션 플랜을 추가하려면 먼저 회의록을 작성해 주세요.
        </Text>
      ) : null}
      {uncertainCreate ? (
        <div role='alert'>
          <Text>
            저장 결과가 불확실해 추가 등록을 멈췄어요. 목록을 새로고침한 후 같은
            액션이 있는지 확인해 주세요.
          </Text>
          <Button
            label='등록 내역 확인'
            isDisabled={!data.canRetry}
            onClick={async () => {
              const results = await data.refetch();
              if (results.every(result => !result.isError)) {
                closeDialog();
                setUncertainCreate(false);
              }
            }}
            variant='secondary'
          />
        </div>
      ) : null}
      <div className={styles.filterBar}>
        <Selector
          label='상태'
          onChange={value => setStatusFilter(value as ActionStatusFilter)}
          options={statusFilterOptions}
          value={statusFilter}
          width='100%'
        />
        <Selector
          label='담당자'
          onChange={setAssigneeFilter}
          options={[
            { label: '전체', value: 'ALL' },
            { label: '미정', value: 'UNASSIGNED' },
            ...team.members.map(member => ({
              label: member.name,
              value: member.id,
            })),
          ]}
          value={assigneeFilter}
          width='100%'
        />
      </div>
      <Card className={styles.tableCard}>
        <div className={styles.tableFrame}>
          <Table<ActionRow>
            columns={columns}
            data={filteredRows}
            density='balanced'
            dividers='grid'
            emptyState={
              <span className={styles.emptyCell}>
                조건에 맞는 액션 플랜이 없어요.
              </span>
            }
            idKey='id'
            plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
            textOverflow='wrap'
            verticalAlign='top'
          />
        </div>
      </Card>
      {deletingAction ? (
        <MeetingActionDeleteDialog
          action={deletingAction}
          teamId={team.id}
          onClose={() => setDeletingAction(null)}
        />
      ) : null}
      <MeetingActionFormDialog
        isUncertain={dialogMode === 'add' && uncertainCreate}
        form={form}
        isOpen={dialogMode !== null}
        isPending={isPending}
        meetings={
          editingAction &&
          !records.some(record => record.id === editingAction.meetingRecord.id)
            ? [editingAction.meetingRecord, ...records]
            : records
        }
        mode={dialogMode ?? 'add'}
        onClose={closeDialog}
        onSubmit={submitDialog}
        setForm={setForm}
        teamMembers={team.members}
      />
    </div>
  );
}
