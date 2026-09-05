import type {
  MeetingActionStatus,
  MeetingRecord,
  TeamMeetingAction,
} from '@aics/core';
import {
  Button,
  Card,
  DateInput,
  Dialog,
  EmptyState,
  Heading,
  IconButton,
  proportional,
  Selector,
  StatusDot,
  Table,
  Text,
  TextInput,
  Tooltip,
  type StatusDotVariant,
  type TableColumn,
  useToast,
} from '@aics/design-system';
import { Pencil } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { useAuthStore } from '~/features/auth/authStore';
import {
  useMeetingRecordsQuery,
  useSubmitMeetingActionMutation,
  useTeamMeetingActionsQuery,
  useUpdateMeetingActionMutation,
} from '~/features/meeting/queries';

import * as styles from './TeamActionPlanPage.css';

type ActionStatusFilter = 'ALL' | MeetingActionStatus;

type ActionRow = TeamMeetingAction;

type ActionFormState = {
  assigneeUserId: string;
  content: string;
  dueDate: string;
  meetingId: string;
};

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

const requestErrorMessage =
  '액션 플랜을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.';

function ActionPlanDialog({
  form,
  isOpen,
  isPending,
  meetings,
  mode,
  onClose,
  onSubmit,
  setForm,
  teamMembers,
}: {
  form: ActionFormState;
  isOpen: boolean;
  isPending: boolean;
  meetings: MeetingRecord[];
  mode: 'add' | 'edit';
  onClose: () => void;
  onSubmit: () => void;
  setForm: (next: ActionFormState) => void;
  teamMembers: { id: string; name: string }[];
}) {
  const isInvalid = !form.content.trim() || !form.meetingId;

  return (
    <Dialog
      aria-label={mode === 'add' ? '액션 플랜 추가' : '액션 플랜 수정'}
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen && !isPending) onClose();
      }}
      purpose='form'
      width={520}
    >
      <form
        className={styles.dialogForm}
        onSubmit={event => {
          event.preventDefault();
          if (!isInvalid) onSubmit();
        }}
      >
        <Heading level={2}>
          {mode === 'add' ? '액션 플랜 추가' : '액션 플랜 수정'}
        </Heading>
        <Selector
          isDisabled={mode === 'edit' || isPending}
          isRequired
          label='회의록'
          onChange={meetingId => setForm({ ...form, meetingId })}
          options={meetings.map(record => ({
            label: record.title,
            value: record.id,
          }))}
          value={form.meetingId}
          width='100%'
        />
        <TextInput
          isDisabled={isPending}
          isRequired
          label='액션 항목'
          onChange={content => setForm({ ...form, content })}
          placeholder='실행할 액션을 입력해 주세요.'
          value={form.content}
          width='100%'
        />
        <Selector
          isDisabled={isPending}
          label='담당자'
          onChange={assigneeUserId => setForm({ ...form, assigneeUserId })}
          options={[
            { label: '미정', value: '' },
            ...teamMembers.map(member => ({
              label: member.name,
              value: member.id,
            })),
          ]}
          value={form.assigneeUserId}
          width='100%'
        />
        <DateInput
          hasClear
          isDisabled={isPending}
          isOptional
          label='기한'
          onChange={dueDate => setForm({ ...form, dueDate: dueDate ?? '' })}
          placeholder='기한 선택'
          value={
            form.dueDate
              ? (form.dueDate as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
              : undefined
          }
          width='100%'
        />
        {mode === 'add' ? (
          <Text color='secondary' type='supporting'>
            새 액션 플랜은 ‘시작 전’ 상태로 추가되며, 추가 후 상태를 변경할 수
            있어요.
          </Text>
        ) : null}
        <div className={styles.dialogActions}>
          <Button
            isDisabled={isPending}
            label='취소'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            isDisabled={isInvalid || isPending}
            isLoading={isPending}
            label={mode === 'add' ? '추가' : '저장'}
            type='submit'
            variant='primary'
          />
        </div>
      </form>
    </Dialog>
  );
}

export default function TeamActionPlanPage() {
  const team = useAuthStore(state => state.currentUser?.currentTeam);
  const recordsQuery = useMeetingRecordsQuery(team?.id);
  const actionsQuery = useTeamMeetingActionsQuery(team?.id);
  const submitActionMutation = useSubmitMeetingActionMutation();
  const updateActionMutation = useUpdateMeetingActionMutation();
  const toast = useToast();
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

  const records = recordsQuery.data ?? [];
  const rows = actionsQuery.data ?? [];
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
      dueDate: row.dueDate ?? '',
      meetingId: row.meetingRecord.id,
    });
  };

  const submitDialog = () => {
    if (!team) return;
    if (dialogMode === 'edit' && editingAction) {
      updateActionMutation.mutate(
        {
          actionId: editingAction.id,
          input: {
            assigneeUserId: form.assigneeUserId || null,
            content: form.content,
            dueDate: form.dueDate || null,
          },
          meetingId: editingAction.meetingRecord.id,
          teamId: team.id,
        },
        {
          onError: () => toast({ body: requestErrorMessage, type: 'error' }),
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
        onError: () => toast({ body: requestErrorMessage, type: 'error' }),
        onSuccess: () => {
          toast({ body: '액션 플랜을 추가했어요.' });
          closeDialog();
        },
      },
    );
  };

  const changeStatus = (row: ActionRow, status: MeetingActionStatus) => {
    if (!team || status === row.status) return;
    updateActionMutation.mutate(
      {
        actionId: row.id,
        input: { status },
        meetingId: row.meetingRecord.id,
        teamId: team.id,
      },
      {
        onError: () => toast({ body: requestErrorMessage, type: 'error' }),
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
            <span>{row.dueDate ?? '미정'}</span>
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
              aria-label={`기한 ${row.dueDate ?? '미정'}, 담당자 ${row.assignee?.name ?? '미정'}`}
              className={styles.mobileActionMeta}
            >
              {row.dueDate ?? '미정'} · {row.assignee?.name ?? '미정'}
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
              isDisabled={updateActionMutation.isPending}
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
                label='수정'
                onClick={() => openEditDialog(row)}
                size='sm'
                variant='secondary'
              />
            </span>
            <span className={styles.mobileEditButton}>
              <IconButton
                icon={<Pencil aria-hidden='true' size={16} />}
                label={`${row.content} 수정`}
                onClick={() => openEditDialog(row)}
                size='sm'
                variant='ghost'
              />
            </span>
          </div>
        ),
        width: proportional(1.4, { minWidth: 0 }),
      },
    ],
    [team, toast, updateActionMutation],
  );

  if (!team) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 배정 후 팀 액션 플랜을 확인할 수 있어요.'
          title='소속 팀이 없어요.'
        />
      </div>
    );
  }

  if (actionsQuery.isPending) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 액션 플랜을 불러오는 중이에요.'
          title='잠시만 기다려 주세요.'
        />
      </div>
    );
  }

  if (actionsQuery.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 액션 플랜을 불러오지 못했어요.'
          title='다시 시도해 주세요.'
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
          isDisabled={recordsQuery.isPending || records.length === 0}
          label='액션 플랜 추가'
          onClick={openAddDialog}
          variant='primary'
        />
      </div>
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
      <ActionPlanDialog
        form={form}
        isOpen={dialogMode !== null}
        isPending={isPending}
        meetings={records}
        mode={dialogMode ?? 'add'}
        onClose={closeDialog}
        onSubmit={submitDialog}
        setForm={setForm}
        teamMembers={team.members}
      />
    </div>
  );
}
