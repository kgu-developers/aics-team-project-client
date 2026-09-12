import {
  Card,
  Button,
  Heading,
  proportional,
  Selector,
  SelectorOption,
  Table,
  Text,
  useToast,
  VStack,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import {
  useAdminPreSurveyResponsesExcelDownloadMutation,
  useAdminPreSurveyResponsesQuery,
} from '~/features/admin-profile/queries';

import * as styles from './AdminPreSurveyResponses.css';

type Section = { code: string; id: string; name: string };

const roleLabels: Record<string, string> = {
  BACKEND: '백엔드 개발',
  DESIGN: '디자인',
  DEVELOPMENT: '개발',
  DOCUMENTATION_PRESENTATION: '문서 작성 및 발표',
  PM: '팀장(프로젝트 매니저)',
  RESEARCH: '자료 수집',
  TEAM_LEADER: '팀장(프로젝트 매니저)',
};

function downloadExcel(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatPreferredRoles(roles: unknown) {
  if (!Array.isArray(roles)) return '-';

  const labels = roles
    .filter((role): role is string => typeof role === 'string')
    .map(role => roleLabels[role] ?? role);

  return labels.length > 0 ? labels.join(', ') : '-';
}

export function AdminPreSurveyResponses({ sections }: { sections: Section[] }) {
  const toast = useToast();
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const firstSectionId = sections[0]?.id ?? '';
  const sectionIds = sections.map(section => section.id).join('|');

  useEffect(() => {
    setSectionId(currentSectionId => {
      const isCurrentSectionAvailable = sectionIds
        .split('|')
        .includes(currentSectionId);

      return isCurrentSectionAvailable ? currentSectionId : firstSectionId;
    });
  }, [firstSectionId, sectionIds]);

  const responsesQuery = useAdminPreSurveyResponsesQuery(
    sectionId || undefined,
  );
  const downloadMutation = useAdminPreSurveyResponsesExcelDownloadMutation();

  function handleExcelDownload() {
    if (!sectionId || downloadMutation.isPending) return;

    downloadMutation.mutate(sectionId, {
      onError: () => {
        toast({
          body: '사전조사 응답 Excel 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
        });
      },
      onSuccess: download => {
        downloadExcel(download.file, download.fileName);
        toast({ body: '사전조사 응답 Excel 파일을 다운로드했어요.' });
      },
    });
  }

  return (
    <Card className={styles.section} padding={4}>
      <VStack gap={4}>
        <header className={styles.header}>
          <Heading level={2}>팀 구성 사전 정보</Heading>
          <Text color='secondary' type='supporting'>
            학생이 제출한 희망 역할, 주제 의견, 기타 의견을 확인하는 영역입니다.
            팀 구성 Excel 업로드와 실제 저장은 서버 연동 후 지원합니다.
          </Text>
          <Button
            isDisabled={!sectionId || downloadMutation.isPending}
            isLoading={downloadMutation.isPending}
            label='엑셀 다운로드'
            onClick={handleExcelDownload}
            variant='secondary'
          />
        </header>

        {sections.length === 0 ? (
          <Text color='secondary' role='status'>
            담당 분반이 없어 사전 정보를 조회할 수 없습니다.
          </Text>
        ) : (
          <>
            <Selector
              label='분반'
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

            {responsesQuery.isPending ? (
              <Text color='secondary' role='status'>
                사전 정보를 불러오는 중입니다.
              </Text>
            ) : responsesQuery.isError ? (
              <Text role='alert'>
                사전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </Text>
            ) : (
              <>
                <Text color='secondary' role='status' type='supporting'>
                  응답 수: {responsesQuery.data.length}명 · 미응답 학생은 현재
                  API 응답에 포함되지 않습니다.
                </Text>

                <div className={styles.table}>
                  <Table
                    columns={[
                      {
                        align: 'start',
                        header: '학번',
                        key: 'userId',
                        width: proportional(0.7, { minWidth: 120 }),
                      },
                      {
                        align: 'start',
                        header: '이름',
                        key: 'userName',
                        width: proportional(0.6, { minWidth: 100 }),
                      },
                      {
                        align: 'start',
                        header: '희망 역할',
                        key: 'preferredRoles',
                        renderCell: response =>
                          formatPreferredRoles(response.preferredRoles),
                        width: proportional(1.1, { minWidth: 180 }),
                      },
                      {
                        align: 'start',
                        header: '주제 의견',
                        key: 'topicOpinion',
                        renderCell: response => response.topicOpinion ?? '-',
                        width: proportional(1.4, { minWidth: 220 }),
                      },
                      {
                        align: 'start',
                        header: '기타 의견',
                        key: 'etcOpinion',
                        renderCell: response => response.etcOpinion ?? '-',
                        width: proportional(1.4, { minWidth: 220 }),
                      },
                      {
                        align: 'start',
                        header: '제출일',
                        key: 'submittedAt',
                        width: proportional(0.9, { minWidth: 160 }),
                      },
                    ]}
                    data={responsesQuery.data}
                    density='balanced'
                    dividers='rows'
                    emptyState={<span>제출된 사전 정보가 없습니다.</span>}
                    idKey='id'
                    plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
                    textOverflow='wrap'
                    verticalAlign='middle'
                  />
                </div>
              </>
            )}
          </>
        )}
      </VStack>
    </Card>
  );
}
