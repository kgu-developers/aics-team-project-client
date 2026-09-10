import type { MeetingAction, MeetingActionStatus } from '@aics/core';
import {
  Button,
  Heading,
  proportional,
  Selector,
  Table,
  Text,
  useToast,
} from '@aics/design-system';
import { useState, type ReactNode } from 'react';

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
  useSubmitMeetingActionMutation,
  useUpdateMeetingActionMutation,
} from '~/features/meeting/queries';

import * as styles from './MeetingRecordActions.css';

const statuses: Record<MeetingActionStatus, string> = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
};

function ActionCell({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.cell}>
      <span className={styles.mobileLabel}>{label}</span>
      {children}
    </div>
  );
}

export default function MeetingRecordActions({
  actions,
  meetingId,
  title,
  teamId,
  members,
  onRefresh,
}: {
  actions: MeetingAction[];
  meetingId: string;
  title: string;
  teamId: string;
  members: { id: string; name: string }[];
  onRefresh: () => Promise<unknown>;
}) {
  const create = useSubmitMeetingActionMutation();
  const update = useUpdateMeetingActionMutation();
  const toast = useToast();
  const [mode, setMode] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<MeetingAction | null>(null);
  const [deleting, setDeleting] = useState<MeetingAction | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<string>();
  const [form, setForm] = useState<ActionFormState>({
    meetingId,
    content: '',
    assigneeUserId: '',
    dueDate: '',
  });
  const pending = create.isPending || update.isPending;
  const open = (action?: MeetingAction) => {
    setError(undefined);
    setEditing(action ?? null);
    setMode(action ? 'edit' : 'add');
    setForm({
      meetingId,
      content: action?.content ?? '',
      assigneeUserId: action?.assignee?.userId ?? '',
      dueDate: actionDueDate(action?.dueDate ?? null),
    });
  };
  const close = () => {
    setMode(null);
    setEditing(null);
  };
  const fail = (cause: unknown) => {
    const message = actionSaveError(cause);
    setError(message);
    toast({ body: message, type: 'error' });
  };
  const submit = () => {
    if (pending || !form.content.trim() || (mode === 'add' && uncertain))
      return;
    if (mode === 'edit' && editing) {
      update.mutate(
        {
          teamId,
          meetingId,
          actionId: editing.id,
          input: {
            content: form.content,
            ...(form.assigneeUserId !== (editing.assignee?.userId ?? '')
              ? { assigneeUserId: form.assigneeUserId || null }
              : {}),
            ...(form.dueDate !== actionDueDate(editing.dueDate)
              ? { dueDate: form.dueDate || null }
              : {}),
          },
        },
        {
          onError: fail,
          onSuccess: () => {
            close();
            toast({ body: '액션 플랜을 수정했어요.' });
          },
        },
      );
    } else {
      create.mutate(
        {
          teamId,
          meetingId,
          input: {
            content: form.content,
            assigneeUserId: form.assigneeUserId || null,
            dueDate: form.dueDate || null,
          },
        },
        {
          onError: cause => {
            fail(cause);
            setUncertain(isActionCreateUncertain(cause));
          },
          onSuccess: () => {
            close();
            toast({ body: '액션 플랜을 추가했어요.' });
          },
        },
      );
    }
  };
  return (
    <section className={styles.section} aria-label='회의록 액션 플랜'>
      <div className={styles.heading}>
        <Heading level={2}>액션 플랜</Heading>
        <Button
          label='액션 추가'
          size='sm'
          variant='secondary'
          isDisabled={pending || uncertain}
          onClick={() => open()}
        />
      </div>
      {error ? <p role='alert'>{error}</p> : null}
      {uncertain ? (
        <div role='status'>
          <Text>
            등록 결과가 불확실해 추가 등록을 멈췄어요. 창을 닫고 등록 내역을
            확인해 주세요.
          </Text>
          <Button
            label='등록 내역 확인'
            variant='secondary'
            onClick={async () => {
              close();
              await onRefresh();
            }}
          />
          <Button
            label='등록 내역을 확인했어요'
            variant='secondary'
            onClick={() => {
              close();
              setError(undefined);
              setUncertain(false);
            }}
          />
        </div>
      ) : null}
      <div className={styles.table}>
        <Table
          columns={[
            {
              header: '할 일',
              key: 'content',
              width: proportional(3, { minWidth: 180 }),
              renderCell: (action: MeetingAction) => (
                <ActionCell label='할 일'>
                  <Text>{action.content}</Text>
                </ActionCell>
              ),
            },
            {
              header: '담당자',
              key: 'assignee',
              width: proportional(1, { minWidth: 90 }),
              renderCell: (action: MeetingAction) => (
                <ActionCell label='담당자'>
                  <Text>{action.assignee?.name ?? '미정'}</Text>
                </ActionCell>
              ),
            },
            {
              header: '기한',
              key: 'dueDate',
              width: proportional(1, { minWidth: 105 }),
              renderCell: (action: MeetingAction) => (
                <ActionCell label='기한'>
                  <Text>{actionDueDate(action.dueDate) || '미정'}</Text>
                </ActionCell>
              ),
            },
            {
              header: '상태',
              key: 'status',
              width: proportional(1.5, { minWidth: 125 }),
              renderCell: (action: MeetingAction) => (
                <ActionCell label='상태'>
                  <Selector
                    isLabelHidden
                    label={action.content + ' 상태'}
                    value={action.status}
                    isDisabled={pending}
                    options={Object.entries(statuses).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    onChange={status => {
                      if (pending || status === action.status) return;
                      update.mutate(
                        {
                          teamId,
                          meetingId,
                          actionId: action.id,
                          input: { status: status as MeetingActionStatus },
                        },
                        { onError: fail, onSuccess: () => setError(undefined) },
                      );
                    }}
                  />
                </ActionCell>
              ),
            },
            {
              header: '관리',
              key: 'manage',
              width: proportional(1.5, { minWidth: 125 }),
              renderCell: (action: MeetingAction) => (
                <ActionCell label='관리'>
                  <div className={styles.controls}>
                    <Button
                      label='수정'
                      size='sm'
                      variant='secondary'
                      isDisabled={pending}
                      onClick={() => open(action)}
                    />
                    <Button
                      label='삭제'
                      size='sm'
                      variant='secondary'
                      isDisabled={pending}
                      onClick={() => setDeleting(action)}
                    />
                  </div>
                </ActionCell>
              ),
            },
          ]}
          data={actions}
          idKey='id'
          density='compact'
          dividers='grid'
          textOverflow='wrap'
          plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
          emptyState={<Text color='secondary'>등록된 액션 플랜이 없어요.</Text>}
        />
      </div>
      <MeetingActionFormDialog
        key={mode ?? 'closed'}
        error={error}
        isOpen={mode !== null}
        mode={mode ?? 'add'}
        form={form}
        setForm={setForm}
        isPending={pending}
        isUncertain={mode === 'add' && uncertain}
        meetings={[{ id: meetingId, title }]}
        teamMembers={members}
        onClose={close}
        onSubmit={submit}
      />
      {deleting ? (
        <MeetingActionDeleteDialog
          action={deleting}
          teamId={teamId}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </section>
  );
}
