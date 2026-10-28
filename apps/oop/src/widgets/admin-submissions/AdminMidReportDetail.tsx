import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Heading,
  Pagination,
  proportional,
  Table,
  Text,
  TextArea,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import {
  useCompleteAdminMidReportFeedbackMutation,
  useAdminMidReportFeedbacksQuery,
  useAdminMidReportQuery,
  useSubmitAdminMidReportFeedbackMutation,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminSubmissionDetailPage.css';

type DisplayField = {
  key: string;
  label: string;
  value: string;
};

type GuiScreen = {
  description: string;
  id: string;
  imageUrl: string | null;
  name: string;
};

type TestCase = {
  description: string;
  id: string;
  input: string;
  output: string;
};

type TestCaseRow = TestCase & { number: number };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function parseBlockFields(fields: unknown): DisplayField[] | null {
  let parsed = fields;

  if (typeof fields === 'string') {
    try {
      parsed = JSON.parse(fields) as unknown;
    } catch {
      return null;
    }
  }

  if (!Array.isArray(parsed)) return null;

  const displayFields = parsed.flatMap((field, index) => {
    if (!isRecord(field) || typeof field.label !== 'string') return [];

    const value = field.value;
    return [
      {
        key: typeof field.key === 'string' ? field.key : String(index),
        label: field.label,
        value:
          typeof value === 'string'
            ? value
            : value == null
              ? '-'
              : JSON.stringify(value, null, 2),
      },
    ];
  });

  return displayFields.length === parsed.length ? displayFields : null;
}

function parseGuiScreens(value: string): GuiScreen[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;

    const screens = parsed.flatMap((screen, index) => {
      if (!isRecord(screen)) return [];

      const imageUrl = screen.imageUrl;
      return [
        {
          description:
            typeof screen.description === 'string' ? screen.description : '',
          id: typeof screen.id === 'string' ? screen.id : String(index),
          imageUrl:
            typeof imageUrl === 'string' &&
            /^(https?:\/\/|\/(?!\/))/.test(imageUrl)
              ? imageUrl
              : null,
          name:
            typeof screen.name === 'string' && screen.name.trim()
              ? screen.name
              : `화면 ${index + 1}`,
        },
      ];
    });

    return screens.length === parsed.length ? screens : null;
  } catch {
    return null;
  }
}

function parseTestCases(value: string): TestCase[] | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return null;

    const testCases = parsed.flatMap((testCase, index) => {
      if (
        !isRecord(testCase) ||
        typeof testCase.description !== 'string' ||
        typeof testCase.input !== 'string' ||
        typeof testCase.output !== 'string'
      )
        return [];

      return [
        {
          description: testCase.description,
          id: typeof testCase.id === 'string' ? testCase.id : String(index),
          input: testCase.input,
          output: testCase.output,
        },
      ];
    });

    return testCases.length === parsed.length ? testCases : null;
  } catch {
    return null;
  }
}

function formatBlockFields(fields: unknown) {
  if (typeof fields === 'string') return fields;

  try {
    return JSON.stringify(fields, null, 2);
  } catch {
    return '작성 내용을 표시할 수 없습니다.';
  }
}

type Props = {
  onOpenGeneralMessage: () => void;
  sectionId: string;
  teamId: string;
};

export function AdminMidReportDetail({
  onOpenGeneralMessage,
  sectionId,
  teamId,
}: Props) {
  const currentUser = useAuthStore(state => state.currentUser);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(0);
  const reportQuery = useAdminMidReportQuery(sectionId, teamId);
  const feedbacksQuery = useAdminMidReportFeedbacksQuery(
    sectionId,
    teamId,
    feedbackPage,
  );
  const submitFeedbackMutation = useSubmitAdminMidReportFeedbackMutation();
  const completeFeedbackMutation = useCompleteAdminMidReportFeedbackMutation();
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const report = reportQuery.data;
  const feedbacks = [...(feedbacksQuery.data?.contents ?? [])].sort(
    (left, right) => left.messageId - right.messageId,
  );
  const relatedMeetingsQuery = useAdminMeetingRecordListQuery(
    [sectionId],
    {
      page: 0,
      sectionId,
      size: 100,
      teamId,
    },
    Boolean(report),
  );
  const feedbackPageable = feedbacksQuery.data?.pageable;
  const relatedMeetings = (relatedMeetingsQuery.data?.contents ?? []).filter(
    record => record.phase === 'MID_CHECK',
  );

  if (reportQuery.isPending) {
    return (
      <Text aria-live='polite' role='status'>
        중간보고서를 불러오는 중입니다.
      </Text>
    );
  }

  if (reportQuery.isError || !report) {
    return (
      <EmptyState
        description='제출 상태와 담당 분반을 확인한 뒤 다시 시도해 주세요.'
        title='중간보고서를 불러오지 못했습니다.'
      />
    );
  }

  return (
    <>
      <Card className={styles.document}>
        <section className={styles.section}>
          <Heading level={2}>제출 현황</Heading>
          <dl className={styles.metadataSummary}>
            <div>
              <dt>팀</dt>
              <dd>
                <Link
                  className={styles.teamLink}
                  params={{ teamId }}
                  search={{ sectionId }}
                  to={ROUTES.ADMIN_TEAM_DETAIL}
                >
                  {report.teamName}
                </Link>
              </dd>
            </div>
            <div>
              <dt>제출자</dt>
              <dd>{report.submittedByName ?? report.submittedBy ?? '-'}</dd>
            </div>
            <div>
              <dt>팀장</dt>
              <dd>{report.leaderName ?? '-'}</dd>
            </div>
            <div>
              <dt>제출 일시</dt>
              <dd>
                {report.submittedAt
                  ? formatSeoulDateTime(report.submittedAt)
                  : '-'}
              </dd>
            </div>
            <div>
              <dt>마감 일시</dt>
              <dd>
                {report.dueDate ? formatSeoulDateTime(report.dueDate) : '-'}
              </dd>
            </div>
          </dl>
          {report.revision?.completedAt ? (
            <Text className={styles.metadata}>
              교수자 최종 확인:{' '}
              {formatSeoulDateTime(report.revision.completedAt)}
              {report.revision.completedBy
                ? ` · ${report.revision.completedBy}`
                : ''}
            </Text>
          ) : report.revision?.requestedAt ? (
            <Text className={styles.metadata}>교수자 최종 확인 전</Text>
          ) : null}
        </section>
        {report.blocks.map(block => {
          const fields = parseBlockFields(block.fields);

          return (
            <section className={styles.section} key={block.key}>
              <Heading level={3}>{block.title}</Heading>
              <Text className={styles.metadata}>
                상태: {block.status} · 마지막 편집:{' '}
                {block.lastEditedByName ?? block.lastEditedBy ?? '-'} ·{' '}
                {block.lastSavedAt
                  ? formatSeoulDateTime(block.lastSavedAt)
                  : '-'}
              </Text>
              {fields ? (
                <div className={styles.fieldGrid}>
                  {fields.map(field => {
                    const guiScreens =
                      field.key === 'guiScreens'
                        ? parseGuiScreens(field.value)
                        : null;
                    const testCases =
                      field.key === 'testCases'
                        ? parseTestCases(field.value)
                        : null;

                    return (
                      <div
                        className={cx(
                          styles.field,
                          (guiScreens || testCases) && styles.fullWidthField,
                        )}
                        key={field.key}
                      >
                        <Text className={styles.fieldLabel}>{field.label}</Text>
                        {guiScreens ? (
                          <ul className={styles.screenList}>
                            {guiScreens.map(screen => (
                              <li className={styles.screenCard} key={screen.id}>
                                {screen.imageUrl ? (
                                  <img
                                    alt={screen.name}
                                    className={styles.imagePreview}
                                    src={screen.imageUrl}
                                  />
                                ) : (
                                  <Text color='secondary'>
                                    등록한 이미지가 없습니다.
                                  </Text>
                                )}
                                <Text weight='medium'>{screen.name}</Text>
                                {screen.description ? (
                                  <Text className={styles.fieldValue}>
                                    {screen.description}
                                  </Text>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : testCases ? (
                          <Table<TestCaseRow>
                            columns={[
                              {
                                align: 'center',
                                header: '번호',
                                key: 'number',
                                width: proportional(0.4, { minWidth: 56 }),
                              },
                              {
                                align: 'start',
                                header: '설명',
                                key: 'description',
                                renderCell: testCase => (
                                  <Text className={styles.fieldValue}>
                                    {testCase.description}
                                  </Text>
                                ),
                                width: proportional(1.4, { minWidth: 180 }),
                              },
                              {
                                align: 'start',
                                header: '입력값',
                                key: 'input',
                                renderCell: testCase => (
                                  <Text className={styles.fieldValue}>
                                    {testCase.input}
                                  </Text>
                                ),
                                width: proportional(1, { minWidth: 140 }),
                              },
                              {
                                align: 'start',
                                header: '기대 출력값',
                                key: 'output',
                                renderCell: testCase => (
                                  <Text className={styles.fieldValue}>
                                    {testCase.output}
                                  </Text>
                                ),
                                width: proportional(1, { minWidth: 140 }),
                              },
                            ]}
                            data={testCases.map((testCase, index) => ({
                              ...testCase,
                              number: index + 1,
                            }))}
                            density='compact'
                            dividers='grid'
                            idKey='id'
                            plugins={{
                              scrollWrapperLayout: tableScrollWrapperPlugin,
                            }}
                            textOverflow='wrap'
                            verticalAlign='top'
                          />
                        ) : (
                          <Text className={styles.fieldValue}>
                            {field.value}
                          </Text>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <pre className={styles.fieldValue}>
                  {formatBlockFields(block.fields)}
                </pre>
              )}
            </section>
          );
        })}
      </Card>
      <Card className={styles.feedbackPanel}>
        <div className={styles.feedbackHeader}>
          <Heading level={3}>중간 보고서 피드백</Heading>
          {report.revision?.requestedAt &&
          !report.revision.completedAt &&
          (report.status === 'REVISION_REQUESTED' ||
            report.status === 'SUBMITTED') ? (
            <Button
              isDisabled={completeFeedbackMutation.isPending}
              label='피드백 반영 최종 확인'
              onClick={() => {
                setCompletionError(null);
                setIsCompletionDialogOpen(true);
              }}
              type='button'
            />
          ) : null}
        </div>
        {feedbacksQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            피드백을 불러오는 중입니다.
          </Text>
        ) : feedbacksQuery.isError ? (
          <Text role='alert'>피드백을 불러오지 못했습니다.</Text>
        ) : feedbacks.length ? (
          <div className={styles.feedbackThread}>
            {feedbacks.map(feedback => (
              <article
                className={cx(
                  styles.feedbackMessage,
                  feedback.senderId === currentUser?.studentNumber &&
                    styles.feedbackOwnMessage,
                )}
                key={feedback.messageId}
              >
                <Text className={styles.feedbackMessageMeta}>
                  {feedback.senderName ?? feedback.senderId} ·{' '}
                  {feedback.createdAt
                    ? formatSeoulDateTime(feedback.createdAt)
                    : '-'}
                </Text>
                <Text className={styles.feedbackMessageContent}>
                  {feedback.message}
                </Text>
              </article>
            ))}
          </div>
        ) : (
          <Text className={styles.sectionDescription}>
            등록된 피드백이 없습니다.
          </Text>
        )}
        {feedbackPageable && feedbackPageable.totalPages > 1 ? (
          <Pagination
            className={styles.feedbackPagination}
            isDisabled={feedbacksQuery.isFetching}
            onChange={page => setFeedbackPage(page - 1)}
            page={feedbackPageable.page + 1}
            pageSize={feedbackPageable.size}
            totalPages={feedbackPageable.totalPages}
            variant='compact'
          />
        ) : null}
        <div className={styles.feedbackComposer}>
          {report.status === 'SUBMITTED' ? (
            <Text className={styles.sectionDescription}>
              수정 요청을 보내면 학생이 수정본을 재제출하기 전까지 추가 수정
              요청을 보낼 수 없습니다. 필요한 내용을 한 메시지에 작성해 주세요.
              추가 안내는 쪽지함의 일반 메시지로 전달할 수 있습니다.
            </Text>
          ) : null}
          <TextArea
            aria-label='중간 보고서 피드백 내용'
            label='중간 보고서 피드백 작성'
            onChange={setFeedbackMessage}
            placeholder={`${report.teamName}에 전달할 피드백을 입력하세요.`}
            value={feedbackMessage}
          />
          <div className={styles.feedbackSubmitAction}>
            <Button
              label='일반 메시지 보내기'
              onClick={onOpenGeneralMessage}
              type='button'
              variant='secondary'
            />
            <Button
              isDisabled={
                !feedbackMessage.trim() ||
                submitFeedbackMutation.isPending ||
                report.status !== 'SUBMITTED'
              }
              isLoading={submitFeedbackMutation.isPending}
              label='수정 요청 보내기'
              onClick={() =>
                submitFeedbackMutation.mutate(
                  {
                    input: { message: feedbackMessage.trim() },
                    sectionId,
                    teamId,
                  },
                  { onSuccess: () => setFeedbackMessage('') },
                )
              }
              type='button'
            />
          </div>
          {report.status !== 'SUBMITTED' ? (
            <Text className={styles.sectionDescription}>
              제출 완료된 중간보고서에만 수정 요청을 보낼 수 있습니다.
            </Text>
          ) : null}
        </div>
      </Card>
      <Dialog
        aria-label='중간보고서 피드백 최종 확인'
        isOpen={isCompletionDialogOpen}
        onOpenChange={isOpen => {
          if (!isOpen && !completeFeedbackMutation.isPending)
            setIsCompletionDialogOpen(false);
        }}
        purpose='info'
        role='alertdialog'
        width={480}
      >
        <div className={styles.confirmationDialogContent}>
          <Heading level={2}>피드백 반영을 최종 확인할까요?</Heading>
          <Text
            className={styles.confirmationDialogDescription}
            color='secondary'
          >
            {report.teamName}의 반영 내용을 확인하면 피드백 절차가 완료됩니다.
            학생에게도 교수자 최종 확인 완료로 표시돼요.
          </Text>
          {completionError ? <Text role='alert'>{completionError}</Text> : null}
          <div className={styles.confirmationDialogActions}>
            <Button
              isDisabled={completeFeedbackMutation.isPending}
              label='취소'
              onClick={() => setIsCompletionDialogOpen(false)}
              variant='secondary'
            />
            <Button
              isDisabled={completeFeedbackMutation.isPending}
              isLoading={completeFeedbackMutation.isPending}
              label='최종 확인'
              onClick={() => {
                setCompletionError(null);
                completeFeedbackMutation.mutate(
                  { sectionId, teamId, version: report.version },
                  {
                    onSuccess: () => setIsCompletionDialogOpen(false),
                    onError: error =>
                      setCompletionError(
                        isAxiosError(error) && error.response?.status === 409
                          ? '보고서가 변경되었거나 완료할 피드백이 없어요. 최신 문서를 다시 확인해 주세요.'
                          : '최종 확인을 저장하지 못했어요. 다시 시도해 주세요.',
                      ),
                  },
                );
              }}
              variant='primary'
            />
          </div>
        </div>
      </Dialog>
      <section className={styles.relatedMeetings}>
        <Heading level={3}>연결된 회의록 ({relatedMeetings.length}건)</Heading>
        {relatedMeetingsQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            회의록을 불러오는 중입니다.
          </Text>
        ) : relatedMeetingsQuery.isError ? (
          <Text role='alert'>연결된 회의록을 불러오지 못했습니다.</Text>
        ) : relatedMeetings.length ? (
          <AdminLinkedMeetingsTable
            authorLabel='작성자 학번'
            records={relatedMeetings.map(record => ({
              authorName: record.authorId,
              id: record.id,
              meetingAt: record.meetingAt,
              participantCount: record.participantCount,
              title: record.title,
            }))}
          />
        ) : (
          <Text className={styles.sectionDescription}>
            연결된 회의록이 없습니다.
          </Text>
        )}
      </section>
    </>
  );
}
