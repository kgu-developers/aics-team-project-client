import type {
  ProjectProposalResponse,
  ProposalDataItem,
  ProposalSectionType,
  UpdateProjectProposalInput,
} from '@aics/core';
import {
  Button,
  Heading,
  proportional,
  Table,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import * as styles from './ProjectProposalFields.css';
import ScreenImageBoard from './ScreenImageBoard';

type Props = {
  project: ProjectProposalResponse;
  section: ProposalSectionType;
  draft: UpdateProjectProposalInput;
  disabled: boolean;
  onChange: (draft: UpdateProjectProposalInput) => void;
};
type DataRow = ProposalDataItem & { id: string; index: number };
const ADD_ROW_ID = 'add-data-row';
const emptyDataRow: ProposalDataItem = {
  name: '',
  description: '',
  expectedCount: '',
};
type MemberRoleRow = { id: string; index: number; name: string; role: string };
const tableLayout = {
  density: 'compact',
  dividers: 'grid',
  idKey: 'id',
  plugins: { scrollWrapperLayout: tableScrollWrapperPlugin },
  textOverflow: 'wrap',
  verticalAlign: 'top',
} as const;
export default function ProjectProposalFields({
  project,
  section,
  draft,
  disabled,
  onChange,
}: Props) {
  const text = (
    key:
      | 'title'
      | 'description'
      | 'goal'
      | 'projectSchedule'
      | 'kickoffRule'
      | 'meetingSchedule',
    label: string,
    multiline = true,
    // The server rejects a blank value, so the field is marked before saving.
    isRequired = false,
  ) => {
    const value = draft[key] ?? '';
    const status =
      isRequired && !value.trim()
        ? {
            isInvalid: true,
            description: `${label}을 입력해야 저장할 수 있어요.`,
          }
        : {};
    return multiline ? (
      <TextArea
        {...status}
        label={label}
        value={value}
        isDisabled={disabled}
        isRequired={isRequired}
        onChange={e => onChange({ ...draft, [key]: e })}
      />
    ) : (
      <TextInput
        {...status}
        label={label}
        value={value}
        isDisabled={disabled}
        isRequired={isRequired}
        onChange={e => onChange({ ...draft, [key]: e })}
      />
    );
  };
  const updateDataRow = (index: number, patch: ProposalDataItem) => {
    const entries = draft.dataConfiguration.length
      ? draft.dataConfiguration
      : [emptyDataRow];
    onChange({
      ...draft,
      dataConfiguration: entries.map((row, i) =>
        i === index ? { ...row, ...patch } : row,
      ),
    });
  };
  if (section === 'TOPIC')
    return (
      <VStack gap={4}>
        {text('title', '프로젝트 제목', false, true)}
        {text('description', '프로젝트 설명', true, true)}
        {text('goal', '프로젝트 목표', true, true)}
      </VStack>
    );
  if (section === 'TEAM_OPERATION') {
    const memberRoles: MemberRoleRow[] = (draft.memberRoles ?? []).map(
      (member, index) => ({
        id: member.studentNumber,
        index,
        name:
          project.teamOperation.members.find(
            m => m.studentNumber === member.studentNumber,
          )?.name ?? member.studentNumber,
        role: member.projectRole ?? '',
      }),
    );
    return (
      <VStack gap={4}>
        {text('kickoffRule', '팀 규칙')}
        {text('meetingSchedule', '회의 시간·빈도·방식')}
        {text('projectSchedule', '진행 일정')}
        <Heading level={3}>역할 분담</Heading>
        {memberRoles.length === 0 ? (
          <Text>등록된 팀원이 없습니다.</Text>
        ) : (
          <div className={styles.tableWrapper}>
            <Table
              {...tableLayout}
              columns={[
                {
                  align: 'start',
                  header: '팀원',
                  key: 'name',
                  renderCell: (row: MemberRoleRow) => (
                    <Text>
                      {row.name} · {row.id}
                    </Text>
                  ),
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '역할',
                  key: 'role',
                  renderCell: (row: MemberRoleRow) => (
                    <TextInput
                      isDisabled={disabled}
                      isLabelHidden
                      label={`${row.name} 역할`}
                      onChange={value =>
                        onChange({
                          ...draft,
                          memberRoles: (draft.memberRoles ?? []).map((m, i) =>
                            i === row.index ? { ...m, projectRole: value } : m,
                          ),
                        })
                      }
                      value={row.role}
                      width='100%'
                    />
                  ),
                  width: proportional(2, { minWidth: 0 }),
                },
              ]}
              data={memberRoles}
            />
          </div>
        )}
      </VStack>
    );
  }
  if (section === 'DATA') {
    // The section always shows one row so a team never starts from an empty table.
    const entries = draft.dataConfiguration.length
      ? draft.dataConfiguration
      : [emptyDataRow];
    const dataRows: DataRow[] = [
      ...entries.map((row, index) => ({ ...row, id: String(index), index })),
      { id: ADD_ROW_ID, index: -1 },
    ];
    const addRow = () =>
      onChange({
        ...draft,
        dataConfiguration: [...entries, emptyDataRow],
      });
    return (
      <VStack gap={4}>
        {
          <div className={styles.tableWrapper}>
            <Table
              {...tableLayout}
              columns={[
                {
                  align: 'start',
                  header: '데이터 이름',
                  key: 'name',
                  renderCell: (row: DataRow) =>
                    row.index < 0 ? (
                      <Button
                        isDisabled={disabled}
                        label='데이터 추가'
                        onClick={addRow}
                        size='sm'
                        variant='secondary'
                      />
                    ) : (
                      <TextInput
                        isDisabled={disabled}
                        isLabelHidden
                        label={`데이터 ${row.index + 1} 이름`}
                        onChange={value =>
                          updateDataRow(row.index, { name: value })
                        }
                        value={row.name ?? ''}
                        width='100%'
                      />
                    ),
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '데이터 설명',
                  key: 'description',
                  renderCell: (row: DataRow) =>
                    row.index < 0 ? null : (
                      <TextArea
                        isDisabled={disabled}
                        isLabelHidden
                        label={`데이터 ${row.index + 1} 설명`}
                        onChange={value =>
                          updateDataRow(row.index, { description: value })
                        }
                        rows={1}
                        value={row.description ?? ''}
                        width='100%'
                      />
                    ),
                  width: proportional(2, { minWidth: 0 }),
                },
                {
                  align: 'start',
                  header: '예상 개수',
                  key: 'expectedCount',
                  renderCell: (row: DataRow) =>
                    row.index < 0 ? null : (
                      <TextInput
                        isDisabled={disabled}
                        isLabelHidden
                        label={`데이터 ${row.index + 1} 예상 개수`}
                        onChange={value =>
                          updateDataRow(row.index, { expectedCount: value })
                        }
                        value={row.expectedCount ?? ''}
                        width='100%'
                      />
                    ),
                  width: proportional(1, { minWidth: 0 }),
                },
                {
                  align: 'end',
                  header: '관리',
                  key: 'actions',
                  renderCell: (row: DataRow) =>
                    row.index < 0 ? null : (
                      <Button
                        isDisabled={disabled || entries.length === 1}
                        label='삭제'
                        onClick={() =>
                          onChange({
                            ...draft,
                            dataConfiguration: entries.filter(
                              (_, i) => i !== row.index,
                            ),
                          })
                        }
                        size='sm'
                        tooltip={
                          entries.length === 1
                            ? '데이터는 최소 한 개가 필요해요.'
                            : undefined
                        }
                        variant='secondary'
                      />
                    ),
                  width: proportional(0.8, { minWidth: 0 }),
                },
              ]}
              data={dataRows}
            />
          </div>
        }
      </VStack>
    );
  }
  return (
    <ScreenImageBoard
      disabled={disabled}
      draft={draft}
      onChange={onChange}
      project={project}
    />
  );
}
