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

import { saveDownload } from '~/shared/lib/saveDownload';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import {
  useAdminPreSurveyResponsesExcelDownloadMutation,
  useAdminPreSurveyResponsesQuery,
} from '~/features/admin-profile/queries';
import { useAdminSectionEnrollmentsQuery } from '~/features/admin-student-team/queries';

import * as styles from './AdminPreSurveyResponses.css';

type Section = { code: string; id: string; name: string };

type PreSurveyTableRow = {
  etcOpinion?: string | null;
  id: number | string;
  preferredRoles: unknown;
  preferredPeerName?: string | null;
  preferredPeerStatus?: string | null;
  preferredPeerUserId?: string | null;
  mutual?: boolean | null;
  submittedAt: string;
  topicOpinion?: string | null;
  userId: string;
  userName: string;
};

function formatPreferredRoles(roles: unknown) {
  if (!Array.isArray(roles)) return '';

  const values = roles.filter(
    (role): role is string => typeof role === 'string',
  );

  return values.length > 0 ? values.join(', ') : '';
}

function formatPreferredPeer(
  userId: string | null | undefined,
  name: string | null | undefined,
  status: string | null | undefined,
  mutual: boolean | null | undefined,
) {
  if (!userId) return '';

  const displayName =
    name === '(탈퇴한 사용자)' ? name : `(${name ?? '탈퇴한 사용자'})`;
  const statusLabels: Record<string, string> = {
    ACCEPTED: '상대가 수락',
    PENDING: '지목함 (상대 응답 대기)',
    REJECTED: '상대가 거절',
  };
  const displayStatus =
    status === 'PENDING' && mutual
      ? '서로 지목 (상대 응답 대기)'
      : (statusLabels[status ?? ''] ?? status ?? '');

  const preferredPeer = `${userId} ${displayName}`;

  return displayStatus ? `${preferredPeer} - ${displayStatus}` : preferredPeer;
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
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(
    sectionId || undefined,
  );
  const downloadMutation = useAdminPreSurveyResponsesExcelDownloadMutation();
  const responsesByUserId = new Map(
    (responsesQuery.data ?? []).map(response => [response.userId, response]),
  );
  const tableRows: PreSurveyTableRow[] = (enrollmentsQuery.data?.contents ?? [])
    .filter(
      enrollment =>
        enrollment.role === 'STUDENT' && enrollment.status === 'ACTIVE',
    )
    .map(enrollment => {
      const response = responsesByUserId.get(enrollment.studentNumber);

      return response
        ? { ...response, userName: enrollment.name }
        : {
            etcOpinion: null,
            id: `not-submitted-${enrollment.studentNumber}`,
            mutual: null,
            preferredPeerName: null,
            preferredPeerStatus: null,
            preferredPeerUserId: null,
            preferredRoles: [],
            submittedAt: '미제출',
            topicOpinion: null,
            userId: enrollment.studentNumber,
            userName: enrollment.name,
          };
    })
    .sort((left, right) => left.userId.localeCompare(right.userId));
  const submittedCount = tableRows.filter(
    row => row.submittedAt !== '미제출',
  ).length;

  function handleExcelDownload() {
    if (!sectionId || downloadMutation.isPending) return;

    downloadMutation.mutate(sectionId, {
      onError: () => {
        toast({
          body: '사전조사 응답 Excel 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
        });
      },
      onSuccess: download => {
        saveDownload(download.file, download.fileName);
        toast({ body: '사전조사 응답 Excel 파일을 다운로드했어요.' });
      },
    });
  }

  return (
    <Card className={styles.section} padding={4}>
      <VStack gap={4}>
        <header className={styles.header}>
          <Heading level={2}>사전 정보 내역</Heading>
          <Text color='secondary' type='supporting'>
            학생이 제출한 희망 역할, 주제 의견, 기타 의견을 확인하는 영역입니다.
          </Text>
        </header>

        {sections.length === 0 ? (
          <Text color='secondary' role='status'>
            담당 분반이 없어 사전 정보를 조회할 수 없습니다.
          </Text>
        ) : (
          <>
            <div className={styles.controls}>
              <div className={styles.sectionSelector}>
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
              </div>
              <Button
                isDisabled={!sectionId || downloadMutation.isPending}
                isLoading={downloadMutation.isPending}
                label='사전 정보 다운로드'
                onClick={handleExcelDownload}
                variant='secondary'
              />
            </div>

            {responsesQuery.isPending || enrollmentsQuery.isPending ? (
              <Text color='secondary' role='status'>
                사전 정보를 불러오는 중입니다.
              </Text>
            ) : responsesQuery.isError ? (
              <Text role='alert'>
                사전 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </Text>
            ) : enrollmentsQuery.isError ? (
              <Text role='alert'>
                수강생 목록을 불러오지 못해 미제출 여부를 확인할 수 없습니다.
                잠시 후 다시 시도해 주세요.
              </Text>
            ) : (
              <>
                <Text color='secondary' role='status' type='supporting'>
                  전체 {tableRows.length}명 · 제출 {submittedCount}명 · 미제출{' '}
                  {tableRows.length - submittedCount}명
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
                        header: '희망 조원',
                        key: 'preferredPeerUserId',
                        renderCell: response =>
                          formatPreferredPeer(
                            response.preferredPeerUserId,
                            response.preferredPeerName,
                            response.preferredPeerStatus,
                            response.mutual,
                          ),
                        width: proportional(1.5, { minWidth: 260 }),
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
                        renderCell: response => response.topicOpinion ?? '',
                        width: proportional(1.4, { minWidth: 220 }),
                      },
                      {
                        align: 'start',
                        header: '기타 의견',
                        key: 'etcOpinion',
                        renderCell: response => response.etcOpinion ?? '',
                        width: proportional(1.4, { minWidth: 220 }),
                      },
                      {
                        align: 'start',
                        header: '제출일',
                        key: 'submittedAt',
                        width: proportional(0.9, { minWidth: 160 }),
                      },
                    ]}
                    data={tableRows}
                    density='balanced'
                    dividers='rows'
                    emptyState={<span>등록된 수강생이 없습니다.</span>}
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
