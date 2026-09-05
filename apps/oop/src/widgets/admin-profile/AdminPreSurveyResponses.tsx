import {
  Card,
  Heading,
  Selector,
  SelectorOption,
  Table,
  Text,
  VStack,
} from '@aics/design-system';
import { useState } from 'react';

import { adminPreSurveyResponsesBySection } from '~/mocks/data/adminPreSurveyResponses';
import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

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

function formatPreferredRoles(roles: string[]) {
  return roles.map(role => roleLabels[role] ?? role).join(', ');
}

export function AdminPreSurveyResponses({ sections }: { sections: Section[] }) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? '');
  const responses = adminPreSurveyResponsesBySection[sectionId] ?? [];

  return (
    <Card className={styles.section} padding={4}>
      <VStack gap={4}>
        <header className={styles.header}>
          <Heading level={2}>팀 구성 사전 정보</Heading>
          <Text color='secondary' type='supporting'>
            학생이 제출한 희망 역할, 주제 의견, 기타 의견을 확인하는 영역입니다.
            팀 구성 Excel 업로드와 실제 저장은 서버 연동 후 지원합니다.
          </Text>
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

            <Text color='secondary' role='status' type='supporting'>
              응답 수: {responses.length}명 · 미응답 학생은 현재 API 응답에
              포함되지 않습니다.
            </Text>

            <div className={styles.table}>
              <Table
                columns={[
                  {
                    align: 'start',
                    header: '학번',
                    key: 'userId',
                    width: 120,
                  },
                  {
                    align: 'start',
                    header: '희망 역할',
                    key: 'preferredRoles',
                    renderCell: response =>
                      formatPreferredRoles(response.preferredRoles),
                    width: 220,
                  },
                  {
                    align: 'start',
                    header: '주제 의견',
                    key: 'topicOpinion',
                    renderCell: response => response.topicOpinion ?? '-',
                    width: 280,
                  },
                  {
                    align: 'start',
                    header: '기타 의견',
                    key: 'etcOpinion',
                    renderCell: response => response.etcOpinion ?? '-',
                    width: 280,
                  },
                  {
                    align: 'start',
                    header: '제출일',
                    key: 'submittedAt',
                    width: 160,
                  },
                ]}
                data={responses}
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
      </VStack>
    </Card>
  );
}
