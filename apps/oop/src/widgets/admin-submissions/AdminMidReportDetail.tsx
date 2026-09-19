import {
  Button,
  Card,
  EmptyState,
  Heading,
  Pagination,
  proportional,
  Table,
  Text,
  TextArea,
} from '@aics/design-system';
import { useState } from 'react';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import {
  useAdminMidReportFeedbacksQuery,
  useAdminMidReportQuery,
  useSubmitAdminMidReportFeedbackMutation,
} from '~/features/admin-milestone-review/queries';

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
            typeof imageUrl === 'string' && /^(https?:\/\/|\/(?!\/))/.test(imageUrl)
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
  sectionId: string;
  teamId: string;
};

export function AdminMidReportDetail({ sectionId, teamId }: Props) {
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackPage, setFeedbackPage] = useState(0);
  const reportQuery = useAdminMidReportQuery(sectionId, teamId);
  const feedbacksQuery = useAdminMidReportFeedbacksQuery(
    sectionId,
    teamId,
    feedbackPage,
  );
  const submitFeedbackMutation = useSubmitAdminMidReportFeedbackMutation();
  const report = reportQuery.data;
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
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>MID REPORT / READ ONLY</Text>
          <Heading level={2}>{report.title}</Heading>
          <Text className={styles.metadata}>
            상태: {report.status} · 현재 버전: {report.version}차
          </Text>
        </div>
        <section className={styles.section}>
          <Heading level={3}>제출 현황</Heading>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀</Text>
              <Text className={styles.fieldValue}>{report.teamName}</Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>제출자</Text>
              <Text className={styles.fieldValue}>
                {report.submittedByName ?? report.submittedBy ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀장</Text>
              <Text className={styles.fieldValue}>
                {report.leaderName ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>제출 일시</Text>
              <Text className={styles.fieldValue}>
                {report.submittedAt
                  ? formatSeoulDateTime(report.submittedAt)
                  : '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>마감 일시</Text>
              <Text className={styles.fieldValue}>
                {report.dueDate ? formatSeoulDateTime(report.dueDate) : '-'}
              </Text>
            </div>
          </div>
        </section>
        {report.blocks.map(block => {
          const fields = parseBlockFields(block.fields);

          return (
            <section className={styles.section} key={block.key}>
              <Heading level={3}>{block.title}</Heading>
              <Text className={styles.metadata}>
                상태: {block.status} · 마지막 편집:{' '}
                {block.lastEditedByName ?? block.lastEditedBy ?? '-'} ·{' '}
                {block.lastSavedAt ? formatSeoulDateTime(block.lastSavedAt) : '-'}
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
                        <Text className={styles.fieldLabel}>
                          {field.label}
                        </Text>
                        {guiScreens ? (
                          <ul className={styles.screenList}>
                            {guiScreens.map(screen => (
                              <li
                                className={styles.screenCard}
                                key={screen.id}
                              >
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
      <Card className={styles.relatedMeetings}>
        <Heading level={3}>중간 점검 피드백</Heading>
        {feedbacksQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            피드백을 불러오는 중입니다.
          </Text>
        ) : feedbacksQuery.isError ? (
          <Text role='alert'>피드백을 불러오지 못했습니다.</Text>
        ) : feedbacksQuery.data?.contents.length ? (
          <div className={styles.feedbackList}>
            {feedbacksQuery.data.contents.map(feedback => (
              <article
                className={styles.feedbackMessage}
                key={feedback.messageId}
              >
                <Text className={styles.fieldLabel}>
                  {feedback.senderName ?? feedback.senderId} ·{' '}
                  {feedback.createdAt
                    ? formatSeoulDateTime(feedback.createdAt)
                    : '-'}
                </Text>
                <Text className={styles.fieldValue}>{feedback.message}</Text>
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
          <TextArea
            aria-label='중간 점검 피드백 내용'
            label='중간 점검 피드백 작성'
            onChange={setFeedbackMessage}
            placeholder={`${report.teamName}에 전달할 피드백을 입력하세요.`}
            value={feedbackMessage}
          />
          <div className={styles.feedbackSubmitAction}>
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
