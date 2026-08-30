import type {
  CreateMeetingRecordInput,
  MeetingAction,
  MeetingActionStatus,
  MeetingRecord,
  RichTextJson,
} from '@aics/core';
import {
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  Card,
  DateInput,
  Dialog,
  EmptyState,
  Heading,
  IconButton,
  MultiSelector,
  proportional,
  Selector,
  Table,
  Text,
  TextInput,
  type TableProps,
  useToast,
} from '@aics/design-system';
import type { TableColumn } from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code2,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';
import { useEditLock } from '~/features/editor/useEditLock';
import {
  useMeetingRecordQuery,
  useMeetingRecordsQuery,
  useRemoveMeetingRecordMutation,
  useSubmitMeetingRecordMutation,
  useUpdateMeetingActionMutation,
  useUpdateMeetingRecordMutation,
} from '~/features/meeting/queries';

import * as styles from './MeetingPages.css';

type DraftAction = {
  id?: string;
  assigneeUserId: string;
  content: string;
  dueDate: string;
};
const emptyDoc: RichTextJson = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};
const statusLabels: Record<MeetingActionStatus, string> = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  DONE: '완료',
};
const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
  label,
  value,
}));
const requestErrorMessage =
  '요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';

function toDateInput(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
function formatHeldAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
  }).format(new Date(value));
}

function hasRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;

  const node = value as { content?: unknown[]; text?: unknown };
  if (typeof node.text === 'string' && node.text.trim()) return true;

  return node.content?.some(hasRichTextContent) ?? false;
}

function createMeetingListColumns(): TableColumn<MeetingRecord>[] {
  const columns: TableColumn<MeetingRecord>[] = [
    {
      key: 'heldAt',
      header: '날짜',
      width: proportional(1, { minWidth: 80 }),
      renderCell: record => <>{record.heldAt.slice(0, 10)}</>,
    },
    {
      key: 'title',
      header: '제목',
      width: proportional(2, { minWidth: 128 }),
      renderCell: record => (
        <div className={styles.listTitleCell}>
          <Link
            className={styles.listTitleLink}
            params={{ meetingId: record.id }}
            to='/student/meetings/$meetingId'
          >
            {record.title}
          </Link>
          <Text color='secondary' type='supporting'>
            참석 {record.participants.length}명 · 액션 플랜{' '}
            {record.actions.length}건
            {record.location ? ` · ${record.location}` : ''}
          </Text>
        </div>
      ),
    },
  ];
  columns.push({
    key: 'createdBy',
    header: '작성자',
    width: proportional(1),
    renderCell: record => <>{record.createdBy.name}</>,
  });
  return columns;
}

type MeetingTablePlugin = NonNullable<
  TableProps<MeetingRecord>['plugins']
>[string];

function toDraftAction(action: MeetingAction): DraftAction {
  return {
    id: action.id,
    assigneeUserId: action.assignee?.userId ?? '',
    content: action.content,
    dueDate: action.dueDate ?? '',
  };
}

function RichTextViewer({ content }: { content: RichTextJson }) {
  const editor = useEditor({
    content,
    editable: false,
    extensions: [StarterKit],
  });
  useEffect(() => {
    editor?.commands.setContent(content);
  }, [content, editor]);
  return (
    <div className={styles.content}>
      <EditorContent editor={editor} />
    </div>
  );
}

function MeetingEditor({
  content,
  isDisabled,
  onChange,
}: {
  content: RichTextJson;
  isDisabled: boolean;
  onChange: (value: RichTextJson) => void;
}) {
  const editor = useEditor({
    content,
    editable: !isDisabled,
    extensions: [StarterKit],
    onUpdate: ({ editor: nextEditor }) =>
      onChange(nextEditor.getJSON() as RichTextJson),
  });
  useEffect(() => {
    editor?.setEditable(!isDisabled);
  }, [editor, isDisabled]);
  useEffect(() => {
    if (!editor || JSON.stringify(editor.getJSON()) === JSON.stringify(content))
      return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);
  return (
    <div className={styles.fields}>
      <Text weight='medium'>회의 내용</Text>
      <div className={styles.toolbar} aria-label='회의 내용 서식'>
        <IconButton
          icon={<Bold aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='굵게'
          onClick={() => editor?.chain().focus().toggleBold().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<Italic aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='기울임'
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<Strikethrough aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='취소선'
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<Heading2 aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='소제목'
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<List aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='글머리표 목록'
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<ListOrdered aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='번호 목록'
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<Quote aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='인용문'
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          size='sm'
          variant='ghost'
        />
        <IconButton
          icon={<Code2 aria-hidden='true' size={18} />}
          isDisabled={isDisabled}
          label='코드 블록'
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          size='sm'
          variant='ghost'
        />
      </div>
      <div className={styles.editor}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ActionFields({
  actions,
  isDisabled,
  members,
  onChange,
}: {
  actions: DraftAction[];
  isDisabled: boolean;
  members: { id: string; name: string }[];
  onChange: (next: DraftAction[]) => void;
}) {
  const update = (index: number, patch: Partial<DraftAction>) =>
    onChange(
      actions.map((action, current) =>
        current === index ? { ...action, ...patch } : action,
      ),
    );
  return (
    <section className={styles.fields} aria-label='액션 플랜'>
      <div className={styles.titleRow}>
        <Heading level={3}>액션 플랜</Heading>
        <Button
          isDisabled={isDisabled}
          label='액션 추가'
          onClick={() =>
            onChange([
              ...actions,
              {
                assigneeUserId: '',
                content: '',
                dueDate: '',
              },
            ])
          }
          size='sm'
          variant='secondary'
        />
      </div>
      {actions.length ? (
        <div className={`${styles.tableFrame} ${styles.responsiveActionTable}`}>
          <Table
            columns={[
              {
                header: '할 일',
                key: 'content',
                renderCell: (action: DraftAction) => (
                  <div className={styles.responsiveActionCell}>
                    <span className={styles.mobileActionLabel}>할 일</span>
                    <TextInput
                      isDisabled={isDisabled}
                      isLabelHidden
                      isRequired
                      label={`할 일 ${actions.indexOf(action) + 1}`}
                      onChange={content =>
                        update(actions.indexOf(action), { content })
                      }
                      placeholder='실행할 일을 입력해 주세요.'
                      value={action.content}
                      width='100%'
                    />
                  </div>
                ),
                width: proportional(3, { minWidth: 240 }),
              },
              {
                header: '담당자',
                key: 'assigneeUserId',
                renderCell: (action: DraftAction) => (
                  <div className={styles.responsiveActionCell}>
                    <span className={styles.mobileActionLabel}>담당자</span>
                    <Selector
                      isDisabled={isDisabled}
                      isLabelHidden
                      label={`할 일 ${actions.indexOf(action) + 1} 담당자`}
                      onChange={assigneeUserId =>
                        update(actions.indexOf(action), { assigneeUserId })
                      }
                      options={[
                        { label: '미정', value: '' },
                        ...members.map(member => ({
                          label: member.name,
                          value: member.id,
                        })),
                      ]}
                      value={action.assigneeUserId}
                      width='100%'
                    />
                  </div>
                ),
                width: proportional(2, { minWidth: 140 }),
              },
              {
                header: '기한',
                key: 'dueDate',
                renderCell: (action: DraftAction) => (
                  <div className={styles.responsiveActionCell}>
                    <span className={styles.mobileActionLabel}>기한</span>
                    <DateInput
                      hasClear
                      isDisabled={isDisabled}
                      isLabelHidden
                      isOptional
                      label={`할 일 ${actions.indexOf(action) + 1} 기한`}
                      onChange={dueDate =>
                        update(actions.indexOf(action), {
                          dueDate: dueDate ?? '',
                        })
                      }
                      placeholder='기한 선택'
                      value={
                        action.dueDate
                          ? (action.dueDate as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                          : undefined
                      }
                      width='100%'
                    />
                  </div>
                ),
                width: proportional(2, { minWidth: 140 }),
              },
              {
                header: '관리',
                key: 'remove',
                renderCell: (action: DraftAction) => (
                  <div className={styles.responsiveActionCell}>
                    <span className={styles.mobileActionLabel}>관리</span>
                    <Button
                      isDisabled={isDisabled}
                      label={`할 일 ${actions.indexOf(action) + 1} 삭제`}
                      onClick={() =>
                        onChange(
                          actions.filter(
                            (_, current) => current !== actions.indexOf(action),
                          ),
                        )
                      }
                      size='sm'
                      variant='secondary'
                    />
                  </div>
                ),
                width: proportional(1, { minWidth: 80 }),
              },
            ]}
            data={actions}
            density='compact'
            dividers='grid'
            textOverflow='wrap'
            verticalAlign='top'
          />
        </div>
      ) : (
        <Text color='secondary' type='supporting'>
          아직 등록된 액션 플랜이 없어요.
        </Text>
      )}
    </section>
  );
}

function MeetingForm({ record }: { record?: MeetingRecord }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const toast = useToast();
  const team = currentUser?.currentTeam;
  const [title, setTitle] = useState(record?.title ?? '');
  const [heldAt, setHeldAt] = useState(
    record ? toDateInput(record.heldAt) : '',
  );
  const [location, setLocation] = useState(record?.location ?? '');
  const [content, setContent] = useState<RichTextJson>(
    record?.content ?? emptyDoc,
  );
  const [participants, setParticipants] = useState(
    record?.participants.map(item => item.userId) ?? [],
  );
  const [actions, setActions] = useState<DraftAction[]>([]);
  const submitMutation = useSubmitMeetingRecordMutation();
  const updateMutation = useUpdateMeetingRecordMutation();
  const lock = useEditLock(
    record ? { targetId: record.id, targetType: 'MEETING_RECORD' } : null,
  );
  const isLocked = Boolean(record && (lock.pending || lock.locked));
  useEffect(() => {
    if (!record) return;
    setTitle(record.title);
    setHeldAt(toDateInput(record.heldAt));
    setLocation(record.location ?? '');
    setContent(record.content);
    setParticipants(record.participants.map(item => item.userId));
    setActions(record.actions.map(toDraftAction));
  }, [record]);
  if (!team)
    return (
      <div className={styles.page}>
        <EmptyState
          description='회의록을 작성하려면 팀에 먼저 배정되어야 해요.'
          title='소속 팀이 없어요.'
        />
      </div>
    );
  const submit = async () => {
    if (
      !title.trim() ||
      !heldAt ||
      participants.length === 0 ||
      actions.some(action => !action.content.trim()) ||
      isLocked
    )
      return;
    const input: CreateMeetingRecordInput = {
      title,
      heldAt: new Date(heldAt).toISOString(),
      location: location || null,
      content,
      participantUserIds: participants,
      actions: actions.map(action => ({
        id: action.id,
        content: action.content,
        assigneeUserId: action.assigneeUserId || null,
        dueDate: action.dueDate || null,
      })),
    };
    try {
      const savedRecord = record
        ? await updateMutation.mutateAsync({
            input,
            meetingId: record.id,
            teamId: team.id,
          })
        : await submitMutation.mutateAsync({ input, teamId: team.id });
      toast({ body: record ? '회의록을 수정했어요.' : '회의록을 등록했어요.' });
      void navigate({
        to: '/student/meetings/$meetingId',
        params: { meetingId: savedRecord.id },
      });
    } catch {
      toast({ body: requestErrorMessage, type: 'error' });
    }
  };
  const pending = submitMutation.isPending || updateMutation.isPending;
  const detailPath = record
    ? `/student/meetings/${record.id}`
    : ROUTES.STUDENT.MEETINGS;

  return (
    <div className={styles.page}>
      <div className={styles.routeHeader}>
        <div className={styles.breadcrumb}>
          <Breadcrumbs label='회의록 경로'>
            <BreadcrumbItem as={Link} href={ROUTES.STUDENT.MEETINGS}>
              회의록
            </BreadcrumbItem>
            {record ? (
              <BreadcrumbItem as={Link} href={detailPath}>
                {record.title}
              </BreadcrumbItem>
            ) : null}
            <BreadcrumbItem isCurrent>
              {record ? '수정' : '새 회의록'}
            </BreadcrumbItem>
          </Breadcrumbs>
        </div>
        <Link
          aria-label={
            record ? '회의록 상세로 돌아가기' : '회의록 목록으로 돌아가기'
          }
          className={styles.backLink}
          to={record ? '/student/meetings/$meetingId' : ROUTES.STUDENT.MEETINGS}
          params={record ? { meetingId: record.id } : undefined}
        >
          {record ? '상세로' : '목록으로'}
        </Link>
      </div>
      <Card className={styles.editorCard}>
        <Heading level={1}>{record ? '회의록 수정' : '새 회의록'}</Heading>
        <div className={styles.fields}>
          {isLocked ? (
            <p className={styles.notice}>
              {lock.ownerName
                ? `${lock.ownerName}님이 편집 중이에요. 잠금이 해제되면 수정할 수 있어요.`
                : '편집 권한을 확인 중이에요.'}
            </p>
          ) : null}
          <div className={styles.documentTitle}>
            <TextInput
              isDisabled={isLocked}
              isRequired
              label='회의 제목'
              onChange={setTitle}
              placeholder='회의 제목을 입력해 주세요.'
              value={title}
              width='100%'
            />
          </div>
          <div className={styles.properties}>
            <DateInput
              hasClear
              isDisabled={isLocked}
              isRequired
              label='회의 일자'
              onChange={value => setHeldAt(value ?? '')}
              placeholder='날짜 선택'
              value={
                heldAt
                  ? (heldAt as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                  : undefined
              }
              width='100%'
            />
            <TextInput
              isDisabled={isLocked}
              label='장소 (선택)'
              onChange={setLocation}
              value={location}
              width='100%'
            />
          </div>
          <section className={styles.fields}>
            <MultiSelector
              description='실제 참석한 팀원을 1명 이상 선택해 주세요.'
              hasClear
              hasSearch
              isDisabled={isLocked}
              isRequired
              label='참석자'
              onChange={setParticipants}
              options={team.members.map(member => ({
                label: member.name,
                value: member.id,
              }))}
              placeholder='참석자를 선택해 주세요.'
              searchPlaceholder='팀원 검색'
              triggerDisplay='labels'
              value={participants}
              width='100%'
            />
          </section>
          <MeetingEditor
            content={content}
            isDisabled={isLocked}
            onChange={setContent}
          />
          <ActionFields
            actions={actions}
            isDisabled={isLocked}
            members={team.members}
            onChange={setActions}
          />
        </div>
        <div className={styles.actions}>
          <Button
            label='취소'
            onClick={() =>
              void navigate({
                to: record
                  ? '/student/meetings/$meetingId'
                  : ROUTES.STUDENT.MEETINGS,
                params: record ? { meetingId: record.id } : undefined,
              })
            }
            variant='secondary'
          />
          <Button
            isDisabled={
              isLocked ||
              !title.trim() ||
              !heldAt ||
              participants.length === 0 ||
              actions.some(action => !action.content.trim())
            }
            isLoading={pending}
            label={record ? '저장' : '등록'}
            onClick={() => void submit()}
            variant='primary'
          />
        </div>
        {submitMutation.isError || updateMutation.isError ? (
          <p className={styles.error} role='alert'>
            {requestErrorMessage}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

export function MeetingListPage() {
  const navigate = useNavigate();
  const teamId = useAuthStore(state => state.currentUser?.currentTeam?.id);
  const query = useMeetingRecordsQuery(teamId);
  const meetingColumns = useMemo(() => createMeetingListColumns(), []);
  const rowInteractionPlugin = useMemo<MeetingTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, item) => {
        const goToDetail = () =>
          void navigate({
            to: '/student/meetings/$meetingId',
            params: { meetingId: item.id },
          });
        const onClick = rowRenderProps.htmlProps.onClick;
        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'data-student-meeting-row': '',
            onClick: event => {
              onClick?.(event);
              if (event.defaultPrevented) return;
              if (
                event.target instanceof Element &&
                event.target.closest('a, button, input, select, textarea')
              )
                return;
              goToDetail();
            },
          },
        };
      },
    }),
    [navigate],
  );
  if (!teamId)
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 배정 후 팀 회의록을 기록할 수 있어요.'
          title='소속 팀이 없어요.'
        />
      </div>
    );
  if (query.isPending)
    return (
      <div className={styles.page}>
        <EmptyState
          description='회의록을 불러오는 중이에요.'
          title='잠시만 기다려 주세요.'
        />
      </div>
    );
  if (query.isError)
    return (
      <div className={styles.page}>
        <EmptyState
          description={requestErrorMessage}
          title='회의록을 불러올 수 없어요.'
        />
      </div>
    );
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>회의록</Heading>
        <Button
          label='새 회의록'
          onClick={() => void navigate({ to: ROUTES.STUDENT.MEETING_NEW })}
          variant='primary'
        />
      </div>
      <Card className={styles.listTableCard}>
        <div className={styles.responsiveListTable}>
          <Table<MeetingRecord>
            columns={meetingColumns}
            data={query.data ?? []}
            density='balanced'
            dividers='rows'
            emptyState={
              <span className={styles.emptyTableCell}>
                등록된 회의록이 없어요.
              </span>
            }
            hasHover
            idKey='id'
            plugins={{ rowInteraction: rowInteractionPlugin }}
          />
        </div>
      </Card>
    </div>
  );
}

function ActionStatusControl({
  action,
  meetingId,
  teamId,
}: {
  action: MeetingAction;
  meetingId: string;
  teamId: string;
}) {
  const mutation = useUpdateMeetingActionMutation();
  const toast = useToast();
  return (
    <Selector
      isLabelHidden
      label={`${action.content} 상태`}
      onChange={status =>
        mutation.mutate(
          {
            actionId: action.id,
            input: { status: status as MeetingActionStatus },
            meetingId,
            teamId,
          },
          {
            onError: () => toast({ body: requestErrorMessage, type: 'error' }),
            onSuccess: () => toast({ body: '액션 플랜 상태를 변경했어요.' }),
          },
        )
      }
      options={statusOptions}
      value={action.status}
      width='100%'
    />
  );
}

export function MeetingDeleteDialog({
  isError,
  isOpen,
  isPending,
  onClose,
  onConfirm,
  record,
}: {
  isError: boolean;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
  record: MeetingRecord;
}) {
  return (
    <Dialog
      aria-label='회의록 삭제 확인'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen && !isPending) onClose();
      }}
      purpose='form'
      width={440}
    >
      <div className={styles.deleteDialogContent}>
        <Heading level={2}>이 회의록을 삭제할까요?</Heading>
        <Text color='secondary'>
          삭제한 회의록과 액션 플랜은 복구할 수 없습니다.
        </Text>
        <Card className={styles.deletePreview} variant='muted'>
          <Text weight='medium'>{record.title}</Text>
          <Text color='secondary' type='supporting'>
            {formatHeldAt(record.heldAt)} · 작성 {record.createdBy.name}
          </Text>
        </Card>
        {isError ? (
          <Text className={styles.error} role='alert'>
            {requestErrorMessage}
          </Text>
        ) : null}
        <div className={styles.dialogActions}>
          <Button
            data-autofocus=''
            isDisabled={isPending}
            label='취소'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            className={styles.deleteButton}
            isLoading={isPending}
            label='삭제'
            onClick={onConfirm}
            variant='secondary'
          />
        </div>
      </div>
    </Dialog>
  );
}

export function MeetingDetailPage({ meetingId }: { meetingId: string }) {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const toast = useToast();
  const query = useMeetingRecordQuery(meetingId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const teamId = currentUser?.currentTeam?.id;
  const removeMutation = useRemoveMeetingRecordMutation();
  if (query.isPending)
    return (
      <div className={styles.page}>
        <EmptyState
          description='회의록을 불러오는 중이에요.'
          title='잠시만 기다려 주세요.'
        />
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className={styles.page}>
        <EmptyState
          description='삭제되었거나 접근 권한이 없는 회의록이에요.'
          title='회의록을 찾을 수 없어요.'
        />
      </div>
    );
  const record = query.data;
  const member = currentUser?.currentTeam?.members.find(
    item => item.id === currentUser.id,
  );
  const canDelete =
    record.createdBy.userId === currentUser?.id || member?.isLeader;
  return (
    <div className={styles.page}>
      <div className={styles.routeHeader}>
        <div className={styles.breadcrumb}>
          <Breadcrumbs label='회의록 경로'>
            <BreadcrumbItem as={Link} href={ROUTES.STUDENT.MEETINGS}>
              회의록
            </BreadcrumbItem>
            <BreadcrumbItem isCurrent>{record.title}</BreadcrumbItem>
          </Breadcrumbs>
        </div>
        <Link
          aria-label='회의록 목록으로 돌아가기'
          className={styles.backLink}
          to={ROUTES.STUDENT.MEETINGS}
        >
          목록으로
        </Link>
      </div>
      <Card className={styles.detailCard}>
        <div>
          <Heading level={1}>{record.title}</Heading>
          <p className={styles.meta}>
            {formatHeldAt(record.heldAt)}
            {record.location ? ` · ${record.location}` : ''}
          </p>
        </div>
        <section>
          <Text weight='medium'>참석자</Text>
          <div className={styles.participantList}>
            {record.participants.map(item => (
              <span className={styles.participant} key={item.userId}>
                {item.name}
              </span>
            ))}
          </div>
        </section>
        <section className={styles.meetingContent}>
          <Heading level={2}>회의 내용</Heading>
          {hasRichTextContent(record.content) ? (
            <RichTextViewer content={record.content} />
          ) : (
            <Text color='secondary'>작성된 회의 내용이 없어요.</Text>
          )}
        </section>
        <section className={styles.fields}>
          <Heading level={2}>액션 플랜</Heading>
          {record.actions.length ? (
            <div
              className={`${styles.tableFrame} ${styles.responsiveActionTable}`}
            >
              <Table
                columns={[
                  {
                    header: '할 일',
                    key: 'content',
                    renderCell: (action: MeetingAction) => (
                      <div className={styles.responsiveActionCell}>
                        <span className={styles.mobileActionLabel}>할 일</span>
                        <span>{action.content}</span>
                      </div>
                    ),
                    width: proportional(3, { minWidth: 220 }),
                  },
                  {
                    header: '담당자',
                    key: 'assignee',
                    renderCell: (action: MeetingAction) => (
                      <div className={styles.responsiveActionCell}>
                        <span className={styles.mobileActionLabel}>담당자</span>
                        <span>{action.assignee?.name ?? '미정'}</span>
                      </div>
                    ),
                    width: proportional(1, { minWidth: 100 }),
                  },
                  {
                    header: '기한',
                    key: 'dueDate',
                    renderCell: (action: MeetingAction) => (
                      <div className={styles.responsiveActionCell}>
                        <span className={styles.mobileActionLabel}>기한</span>
                        <span>{action.dueDate ?? '미정'}</span>
                      </div>
                    ),
                    width: proportional(1, { minWidth: 110 }),
                  },
                  {
                    header: '상태',
                    key: 'status',
                    renderCell: (action: MeetingAction) => (
                      <div className={styles.responsiveActionCell}>
                        <span className={styles.mobileActionLabel}>상태</span>
                        <ActionStatusControl
                          action={action}
                          meetingId={meetingId}
                          teamId={record.teamId}
                        />
                      </div>
                    ),
                    width: proportional(2, { minWidth: 140 }),
                  },
                ]}
                data={record.actions}
                density='compact'
                dividers='grid'
                idKey='id'
                textOverflow='wrap'
              />
            </div>
          ) : (
            <Text color='secondary'>등록된 액션 플랜이 없어요.</Text>
          )}
        </section>
        <footer className={styles.detailFooter}>
          <Text color='secondary' type='supporting'>
            최초 작성 {record.createdBy.name} · 최종 수정{' '}
            {formatHeldAt(record.updatedAt)}
          </Text>
          <div className={`${styles.actions} ${styles.detailActions}`}>
            {canDelete ? (
              <Button
                label='삭제'
                onClick={() => setIsDeleteDialogOpen(true)}
                variant='secondary'
              />
            ) : null}
            <Button
              label='수정'
              onClick={() =>
                void navigate({
                  to: '/student/meetings/$meetingId/edit',
                  params: { meetingId },
                })
              }
              variant='secondary'
            />
          </div>
        </footer>
      </Card>
      <MeetingDeleteDialog
        isError={removeMutation.isError}
        isOpen={isDeleteDialogOpen}
        isPending={removeMutation.isPending}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (!teamId) return;
          removeMutation.mutate(
            { meetingId, teamId },
            {
              onError: () =>
                toast({ body: requestErrorMessage, type: 'error' }),
              onSuccess: () => {
                toast({ body: '회의록을 삭제했어요.' });
                void navigate({ to: ROUTES.STUDENT.MEETINGS });
              },
            },
          );
        }}
        record={record}
      />
    </div>
  );
}
export function MeetingNewPage() {
  return <MeetingForm />;
}
export function MeetingEditPage({ meetingId }: { meetingId: string }) {
  const query = useMeetingRecordQuery(meetingId);
  if (query.isPending)
    return (
      <div className={styles.page}>
        <EmptyState
          description='회의록을 불러오는 중이에요.'
          title='잠시만 기다려 주세요.'
        />
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className={styles.page}>
        <EmptyState
          description='수정할 회의록을 찾을 수 없어요.'
          title='회의록을 찾을 수 없어요.'
        />
      </div>
    );
  return <MeetingForm record={query.data} />;
}
