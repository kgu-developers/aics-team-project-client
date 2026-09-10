import type {
  CreateMeetingRecordInput,
  MeetingAction,
  MeetingRecord,
  MeetingPhase,
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
  TimeInput,
  type TimeInputProps,
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

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { useAuthStore } from '~/features/auth/authStore';
import { MeetingCreateError } from '~/features/meeting/model/meetingCreateError';
import {
  meetingPhaseLabels,
  type StudentMeetingRecord,
} from '~/features/meeting/model/studentMeeting';
import {
  useMeetingRecordQuery,
  type StudentMeetingListItem,
  useStudentMeetingListQuery,
  useRemoveMeetingRecordMutation,
  useCreateMeetingWithActions,
  useUpdateMeetingRecordMutation,
  useMeetingTeamQuery,
} from '~/features/meeting/queries';

import * as styles from './MeetingPages.css';
import MeetingRecordActions from './MeetingRecordActions';

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
const requestErrorMessage =
  '요청을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.';

function toDateInput(value: string) {
  return value.slice(0, 10);
}
function formatHeldAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'long',
  }).format(new Date(value.replace(' ', 'T')));
}

function hasRichTextContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;

  const node = value as { content?: unknown[]; text?: unknown };
  if (typeof node.text === 'string' && node.text.trim()) return true;

  return node.content?.some(hasRichTextContent) ?? false;
}

function createMeetingListColumns({
  canOpenRecord,
  headingLabel,
  authorColumnLabel,
}: {
  canOpenRecord: boolean;
  headingLabel: string;
  authorColumnLabel: string;
}): TableColumn<StudentMeetingListItem>[] {
  const columns: TableColumn<StudentMeetingListItem>[] = [
    {
      key: 'heldAt',
      header: '날짜',
      width: proportional(1, { minWidth: 80 }),
      renderCell: record => <>{record.heldAt.slice(0, 10)}</>,
    },
    {
      key: 'heading',
      header: headingLabel,
      width: proportional(2, { minWidth: 128 }),
      renderCell: record => (
        <div className={styles.listTitleCell}>
          {canOpenRecord ? (
            <Link
              className={styles.listTitleLink}
              params={{ meetingId: record.id }}
              to='/student/meetings/$meetingId'
            >
              {record.heading}
            </Link>
          ) : (
            <Text>{record.heading}</Text>
          )}
          <Text color='secondary' type='supporting'>
            참석 {record.participantCount}명
            {record.actionCount != null
              ? ` · 액션 플랜 ${record.actionCount}건`
              : ''}
            {record.location ? ` · ${record.location}` : ''}
          </Text>
        </div>
      ),
    },
  ];
  columns.push({
    key: 'authorLabel',
    header: authorColumnLabel,
    width: proportional(1),
    renderCell: record => <>{record.authorLabel}</>,
  });
  return columns;
}

type MeetingTablePlugin = NonNullable<
  TableProps<StudentMeetingListItem>['plugins']
>[string];

function toDraftAction(action: MeetingAction): DraftAction {
  return {
    id: action.id,
    assigneeUserId: action.assignee?.userId ?? '',
    content: action.content,
    dueDate: action.dueDate?.slice(0, 10) ?? '',
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
  savedIndexes = [],
  lockRows = false,
  emptyMessage = '아직 등록된 액션 플랜이 없어요.',
  isDisabled,
  members,
  onChange,
}: {
  actions: DraftAction[];
  savedIndexes?: number[];
  lockRows?: boolean;
  emptyMessage?: string;
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
          isDisabled={isDisabled || lockRows}
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
                    isDisabled={
                      isDisabled ||
                      savedIndexes.includes(actions.indexOf(action))
                    }
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
                    isDisabled={
                      isDisabled ||
                      savedIndexes.includes(actions.indexOf(action))
                    }
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
                    isDisabled={
                      isDisabled ||
                      savedIndexes.includes(actions.indexOf(action))
                    }
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
                  {savedIndexes.includes(actions.indexOf(action)) ? (
                    <Text>저장됨</Text>
                  ) : (
                    <Button
                      isDisabled={isDisabled || lockRows}
                      label='삭제'
                      onClick={() =>
                        onChange(
                          actions.filter(
                            (_, current) => current !== actions.indexOf(action),
                          ),
                        )
                      }
                      size='md'
                      variant='secondary'
                      width='fit-content'
                    />
                  )}
                </div>
              ),
              width: proportional(1, { minWidth: 80 }),
            },
          ]}
          data={actions}
          emptyState={
            <Text color='secondary' type='supporting'>
              {emptyMessage}
            </Text>
          }
          density='compact'
          dividers='grid'
          plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
          textOverflow='wrap'
          verticalAlign='top'
        />
      </div>
    </section>
  );
}

function MeetingForm({ record }: { record?: StudentMeetingRecord }) {
  const navigate = useNavigate();
  const toast = useToast();
  const context = useMeetingTeamQuery();
  const team = context.team;
  const [title, setTitle] = useState(record?.title ?? '');
  const [heldAt, setHeldAt] = useState(
    record ? toDateInput(record.heldAt) : '',
  );
  const [meetingTime, setMeetingTime] = useState(
    record?.heldAt.slice(11, 16) ?? '',
  );
  const [phase, setPhase] = useState<MeetingPhase>(record?.phase ?? 'PROPOSAL');
  const [saveError, setSaveError] = useState<MeetingCreateError | null>(null);
  const [location, setLocation] = useState(record?.location ?? '');
  const [content, setContent] = useState<RichTextJson>(
    record?.content ?? emptyDoc,
  );
  const [participants, setParticipants] = useState(
    record?.participants.map(item => item.userId) ?? [],
  );
  const [actions, setActions] = useState<DraftAction[]>(
    record?.actions.map(toDraftAction) ?? [],
  );
  const creation = useCreateMeetingWithActions();
  const updateMutation = useUpdateMeetingRecordMutation();
  const pending = record ? updateMutation.isPending : creation.isPending;
  const isDisabled =
    pending || Boolean(saveError?.uncertain) || creation.isUncertain;
  const fieldsDisabled = isDisabled || Boolean(creation.meetingId);
  if (context.isError || context.isPending)
    return (
      <div className={styles.page}>
        <EmptyState
          title={
            context.isError
              ? '팀 정보를 불러올 수 없어요.'
              : '잠시만 기다려 주세요.'
          }
          description={
            context.isError
              ? requestErrorMessage
              : '참석자를 선택할 수 있도록 팀 정보를 불러오는 중이에요.'
          }
        />
        {context.isError ? (
          <Button
            label='다시 시도'
            isDisabled={!context.canRetry}
            onClick={() => void context.refetch()}
            size='md'
            width='fit-content'
          />
        ) : null}
      </div>
    );
  if (!team)
    return (
      <div className={styles.page}>
        <EmptyState
          title='소속 팀이 없어요.'
          description='회의록을 작성하려면 팀에 먼저 배정되어야 해요.'
        />
      </div>
    );
  const submit = async () => {
    if (
      !title.trim() ||
      !heldAt ||
      participants.length === 0 ||
      (context.canManageActions &&
        actions.some(action => !action.content.trim())) ||
      (context.requiresPhaseAndTime && !meetingTime) ||
      isDisabled
    )
      return;
    const input: CreateMeetingRecordInput = {
      title,
      heldAt: `${heldAt}T${meetingTime || '00:00'}:00`,
      location: location || null,
      content,
      participantUserIds: participants,
      actions: (context.canManageActions ? actions : []).map(action => ({
        id: action.id,
        content: action.content,
        assigneeUserId: action.assigneeUserId || null,
        dueDate: action.dueDate || null,
      })),
    };
    try {
      setSaveError(null);
      const savedRecord = record
        ? await updateMutation.mutateAsync({
            input,
            teamId: team.id,
            meetingId: record.id,
          })
        : await creation.save({ input, teamId: team.id, phase });
      if (!savedRecord) return;
      toast({ body: record ? '회의록을 수정했어요.' : '회의록을 등록했어요.' });
      void navigate({
        to: '/student/meetings/$meetingId',
        params: { meetingId: savedRecord.id },
      });
    } catch (error) {
      if (error instanceof MeetingCreateError) {
        setSaveError(error);
      }
      toast({
        body:
          error instanceof MeetingCreateError
            ? error.message
            : requestErrorMessage,
        type: 'error',
      });
    }
  };
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
          <div className={styles.documentTitle}>
            <TextInput
              isDisabled={fieldsDisabled}
              isRequired
              label='회의 제목'
              onChange={setTitle}
              placeholder='회의 제목을 입력해 주세요.'
              value={title}
              width='100%'
            />
          </div>
          <div className={styles.properties}>
            {context.requiresPhaseAndTime ? (
              <Selector
                label='회의 단계'
                isRequired
                isDisabled={fieldsDisabled}
                options={Object.entries(meetingPhaseLabels).map(
                  ([value, label]) => ({ value, label }),
                )}
                value={phase}
                onChange={value => setPhase(value as MeetingPhase)}
                width='100%'
              />
            ) : null}
            <DateInput
              hasClear
              isDisabled={fieldsDisabled}
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
            {context.requiresPhaseAndTime ? (
              <TimeInput
                label='회의 시간'
                isRequired
                isDisabled={fieldsDisabled}
                hourFormat='24h'
                value={
                  meetingTime
                    ? (meetingTime as TimeInputProps['value'])
                    : undefined
                }
                onChange={value => setMeetingTime(value ?? '')}
                width='100%'
              />
            ) : null}
            <TextInput
              isDisabled={fieldsDisabled}
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
              isDisabled={fieldsDisabled}
              isRequired
              label='참석자'
              onChange={setParticipants}
              options={[
                ...team.members,
                ...(record?.participants
                  .filter(
                    person =>
                      !team.members.some(member => member.id === person.userId),
                  )
                  .map(person => ({ id: person.userId, name: person.name })) ??
                  []),
              ].map(member => ({
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
            isDisabled={fieldsDisabled}
            onChange={setContent}
          />
          <ActionFields
            actions={actions}
            emptyMessage={
              context.canManageActions
                ? undefined
                : '액션 플랜 등록은 준비 중이에요.'
            }
            isDisabled={isDisabled || !context.canManageActions}
            savedIndexes={creation.savedActionIndexes}
            lockRows={Boolean(creation.meetingId)}
            members={team.members}
            onChange={setActions}
          />
        </div>
        <div className={styles.actions}>
          <Button
            label={creation.meetingId ? '회의록 상세로' : '취소'}
            isDisabled={pending}
            onClick={() =>
              void navigate({
                to:
                  record || creation.meetingId
                    ? '/student/meetings/$meetingId'
                    : ROUTES.STUDENT.MEETINGS,
                params:
                  record || creation.meetingId
                    ? { meetingId: record?.id ?? creation.meetingId! }
                    : undefined,
              })
            }
            variant='secondary'
          />
          <Button
            isDisabled={
              isDisabled ||
              (context.requiresPhaseAndTime && !meetingTime) ||
              !title.trim() ||
              !heldAt ||
              participants.length === 0 ||
              (context.canManageActions &&
                actions.some(action => !action.content.trim()))
            }
            isLoading={pending}
            label={
              record ? '저장' : creation.meetingId ? '남은 액션 저장' : '등록'
            }
            onClick={() => void submit()}
            variant='primary'
          />
        </div>
        {creation.meetingId ? (
          <div role='status'>
            <Text>
              회의록은 저장했어요. 액션 {actions.length}개 중{' '}
              {creation.savedActionIndexes.length}개를 저장했어요.
            </Text>
            <Text color='secondary'>
              저장된 행은 다시 등록하지 않아요. 이 화면을 나가면 아직 저장하지
              못한 입력은 사라져요.
            </Text>
          </div>
        ) : null}
        {creation.error ? (
          <div className={styles.error} role='alert'>
            <p>{creation.error}</p>
            {creation.meetingId ? (
              <Link
                to='/student/meetings/$meetingId'
                params={{ meetingId: creation.meetingId }}
              >
                저장된 회의록 확인
              </Link>
            ) : creation.isUncertain ? (
              <Link to={ROUTES.STUDENT.MEETINGS}>회의록 목록 확인</Link>
            ) : null}
          </div>
        ) : null}
        {updateMutation.isError ? (
          <div className={styles.error} role='alert'>
            <p>{saveError?.message ?? requestErrorMessage}</p>
            {saveError?.uncertain ? (
              <Link to={ROUTES.STUDENT.MEETINGS}>회의록 목록 확인</Link>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export function MeetingListPage() {
  const navigate = useNavigate();
  const query = useStudentMeetingListQuery();
  const { teamId, canOpenRecord, headingLabel, authorColumnLabel } = query;
  const meetingColumns = useMemo(
    () =>
      createMeetingListColumns({
        canOpenRecord,
        headingLabel,
        authorColumnLabel,
      }),
    [canOpenRecord, headingLabel, authorColumnLabel],
  );
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
  if (teamId == null)
    return (
      <div className={styles.page}>
        <EmptyState
          description='팀 배정 후 팀 회의록을 기록할 수 있어요.'
          title='소속 팀이 없어요.'
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
        <Button
          label='다시 시도'
          isDisabled={!query.canRetry}
          onClick={() => void query.refetch()}
          size='md'
          width='fit-content'
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
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>회의록</Heading>
        <Button
          label='새 회의록'
          isDisabled={!query.canCreateRecord}
          onClick={() => void navigate({ to: ROUTES.STUDENT.MEETING_NEW })}
          variant='primary'
        />
      </div>
      <Card className={styles.listTableCard}>
        <div className={styles.responsiveListTable}>
          <Table<StudentMeetingListItem>
            columns={meetingColumns}
            data={query.items ?? []}
            density='balanced'
            dividers='rows'
            emptyState={
              <span className={styles.emptyTableCell}>
                등록된 회의록이 없어요.
              </span>
            }
            hasHover={canOpenRecord}
            idKey='id'
            plugins={{
              ...(canOpenRecord
                ? { rowInteraction: rowInteractionPlugin }
                : {}),
              scrollWrapperLayout: tableScrollWrapperPlugin,
            }}
          />
        </div>
      </Card>
    </div>
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
  const navigate = useNavigate();
  const toast = useToast();
  const query = useMeetingRecordQuery(meetingId);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const context = useMeetingTeamQuery();
  const teamId = context.teamId;
  const removeMutation = useRemoveMeetingRecordMutation();
  if (!query.teamId)
    return (
      <div className={styles.page}>
        <EmptyState
          title='소속 팀이 없어요.'
          description='팀 배정 후 회의록을 확인할 수 있어요.'
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
  const canDelete =
    record.teamId === teamId &&
    context.canDeleteRecord(record.createdBy.userId);
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
            {record.phase
              ? ` ${record.heldAt.slice(11, 16)} · ${meetingPhaseLabels[record.phase]}`
              : ''}
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
        <MeetingRecordActions
          key={record.teamId + ':' + record.id}
          actions={record.actions}
          meetingId={record.id}
          title={record.title}
          teamId={record.teamId}
          members={context.team?.members ?? []}
          onRefresh={query.refetch}
        />
        <footer className={styles.detailFooter}>
          <Text color='secondary' type='supporting'>
            최초 작성 {record.createdBy.name} · 최종 수정{' '}
            {formatHeldAt(record.updatedAt)}
          </Text>
          <div className={`${styles.actions} ${styles.detailActions}`}>
            {canDelete ? (
              <Button
                aria-label='회의록 삭제'
                label='삭제'
                onClick={() => setIsDeleteDialogOpen(true)}
                variant='secondary'
              />
            ) : null}
            {context.canEditRecord ? (
              <Button
                aria-label='회의록 수정'
                label='수정'
                onClick={() =>
                  void navigate({
                    to: '/student/meetings/$meetingId/edit',
                    params: { meetingId },
                  })
                }
                variant='secondary'
              />
            ) : null}
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
  const currentUser = useAuthStore(state => state.currentUser);
  return (
    <MeetingForm key={currentUser?.teamId ?? currentUser?.currentTeam?.id} />
  );
}
export function MeetingEditPage({ meetingId }: { meetingId: string }) {
  const context = useMeetingTeamQuery();
  const query = useMeetingRecordQuery(
    context.canEditRecord ? meetingId : undefined,
  );
  if (!context.canEditRecord)
    return (
      <div className={styles.page}>
        <EmptyState
          title='회의록 수정은 준비 중이에요.'
          description='회의록 상세에서 내용을 확인할 수 있어요.'
        />
        <Link to='/student/meetings/$meetingId' params={{ meetingId }}>
          회의록 상세로 돌아가기
        </Link>
      </div>
    );
  if (!query.teamId)
    return (
      <div className={styles.page}>
        <EmptyState
          title='소속 팀이 없어요.'
          description='팀 배정 후 회의록을 확인할 수 있어요.'
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
  if (query.isError || !query.data)
    return (
      <div className={styles.page}>
        <EmptyState
          description='수정할 회의록을 찾을 수 없어요.'
          title='회의록을 찾을 수 없어요.'
        />
      </div>
    );
  return (
    <MeetingForm
      key={`${query.data.teamId}:${query.data.id}`}
      record={query.data}
    />
  );
}
