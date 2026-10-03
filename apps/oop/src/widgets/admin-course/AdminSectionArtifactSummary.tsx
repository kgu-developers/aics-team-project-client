import {
  Button,
  Card,
  DateInput,
  EmptyState,
  Heading,
  proportional,
  Selector,
  SelectorOption,
  Table,
  Text,
  useToast,
  VStack,
} from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import { saveDownload } from '~/shared/lib/saveDownload';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import {
  useAdminSectionArtifactSummaryQuery,
  useDownloadAdminSectionArtifactsExcelMutation,
} from '~/features/admin-section-artifact/queries';

import * as styles from './AdminSectionArtifactSummary.css';

type Section = { code: string; id: string; name: string };

function getSeoulTodayDate() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      day: '2-digit',
      month: '2-digit',
      timeZone: 'Asia/Seoul',
      year: 'numeric',
    })
      .formatToParts(new Date())
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function AdminSectionArtifactSummary({
  initialSectionId,
  sections,
}: {
  initialSectionId?: string;
  sections: Section[];
}) {
  const toast = useToast();
  const [sectionId, setSectionId] = useState(() =>
    sections.some(section => section.id === initialSectionId)
      ? initialSectionId!
      : (sections[0]?.id ?? ''),
  );
  const [asOf, setAsOf] = useState(getSeoulTodayDate);
  const today = useMemo(getSeoulTodayDate, []);
  const firstSectionId = sections[0]?.id ?? '';
  const sectionIds = sections.map(section => section.id).join('|');

  useEffect(() => {
    if (initialSectionId && sectionIds.split('|').includes(initialSectionId)) {
      setSectionId(initialSectionId);
      return;
    }

    setSectionId(currentSectionId => {
      const isCurrentSectionAvailable = sectionIds
        .split('|')
        .includes(currentSectionId);

      return isCurrentSectionAvailable ? currentSectionId : firstSectionId;
    });
  }, [firstSectionId, initialSectionId, sectionIds]);

  const summaryQuery = useAdminSectionArtifactSummaryQuery(
    sectionId || undefined,
    asOf || undefined,
  );
  const downloadMutation = useDownloadAdminSectionArtifactsExcelMutation();

  function handleExcelDownload() {
    if (!sectionId || !asOf || downloadMutation.isPending) return;

    downloadMutation.mutate(
      { asOf, sectionId },
      {
        onError: () => {
          toast({
            body: '분반 산출물 현황 Excel 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
          });
        },
        onSuccess: download => {
          saveDownload(download.file, download.fileName);
          toast({ body: '분반 산출물 현황 Excel 파일을 다운로드했어요.' });
        },
      },
    );
  }

  return (
    <section
      aria-labelledby='section-artifact-summary-title'
      className={styles.section}
    >
      <Card padding={4}>
        <VStack gap={4}>
          <header className={styles.header}>
            <Heading id='section-artifact-summary-title' level={2}>
              분반 산출물 현황
            </Heading>
            <Text color='secondary' type='supporting'>
              기준일 종료 시각까지의 팀별 회의록·제출 현황을 확인하고 Excel로
              내려받을 수 있습니다.
            </Text>
          </header>

          {sections.length === 0 ? (
            <Text color='secondary' role='status'>
              담당 분반이 없어 산출물 현황을 조회할 수 없습니다.
            </Text>
          ) : (
            <>
              <div className={styles.controls}>
                <Selector
                  label='산출물 분반'
                  onChange={setSectionId}
                  options={sections.map(section => ({
                    label: `${section.code} (${section.name})`,
                    value: section.id,
                  }))}
                  renderOption={option => (
                    <SelectorOption label={option.label ?? option.value} />
                  )}
                  value={sectionId}
                  width='100%'
                />
                <DateInput
                  format='system_date'
                  isRequired
                  label='집계 기준일'
                  max={
                    today as `${number}${number}${number}${number}-${number}${number}-${number}${number}`
                  }
                  onChange={date => setAsOf(date ?? '')}
                  value={
                    asOf
                      ? (asOf as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
                      : undefined
                  }
                  width='100%'
                />
                <Button
                  className={styles.downloadButton}
                  isDisabled={!sectionId || !asOf || downloadMutation.isPending}
                  label={
                    downloadMutation.isPending
                      ? '다운로드 준비 중'
                      : '산출물 현황 다운로드'
                  }
                  onClick={handleExcelDownload}
                  variant='secondary'
                />
              </div>

              <Card padding={3} variant='muted'>
                <Text color='secondary' type='supporting'>
                  Excel의 단계별 제출 현황에서 상태는 선택한 기준일의 상태가
                  아니라 다운로드 시점의 최신 상태입니다.
                </Text>
              </Card>

              {summaryQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  산출물 현황을 불러오는 중입니다.
                </Text>
              ) : summaryQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='산출물 현황을 불러오지 못했습니다.'
                />
              ) : (
                <>
                  <Text color='secondary' role='status' type='supporting'>
                    {summaryQuery.data?.sectionName ?? ''} ·{' '}
                    {summaryQuery.data?.asOf ?? asOf} 기준
                  </Text>
                  <Table
                    aria-label='분반 산출물 현황'
                    columns={[
                      {
                        align: 'start',
                        header: '팀',
                        key: 'teamName',
                        width: proportional(0.7, { minWidth: 100 }),
                      },
                      {
                        align: 'start',
                        header: '팀원',
                        key: 'members',
                        renderCell: row => (
                          <div className={styles.members}>
                            {row.members.map(member => (
                              <span key={member.studentNumber}>
                                {member.studentNumber} {member.name}
                              </span>
                            ))}
                          </div>
                        ),
                        width: proportional(1.4, { minWidth: 190 }),
                      },
                      {
                        align: 'end',
                        header: '회의록 수',
                        key: 'meetingRecordCount',
                        width: proportional(0.7, { minWidth: 110 }),
                      },
                      {
                        align: 'end',
                        header: '회의록 수정 횟수',
                        key: 'meetingRecordEditCount',
                        width: proportional(0.9, { minWidth: 140 }),
                      },
                      {
                        align: 'end',
                        header: '제출 이력 단계 수',
                        key: 'submittedStageCount',
                        width: proportional(0.9, { minWidth: 140 }),
                      },
                      {
                        align: 'end',
                        header: '마감된 미제출 단계 수',
                        key: 'overdueMissingStageCount',
                        width: proportional(1, { minWidth: 160 }),
                      },
                    ]}
                    data={summaryQuery.data?.contents ?? []}
                    density='balanced'
                    dividers='rows'
                    emptyState={<span>등록된 팀이 없습니다.</span>}
                    idKey='teamId'
                    plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
                    textOverflow='wrap'
                    verticalAlign='middle'
                  />
                </>
              )}
            </>
          )}
        </VStack>
      </Card>
    </section>
  );
}
