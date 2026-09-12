import {
  Button,
  proportional,
  Table,
  TextArea,
  VStack,
} from '@aics/design-system';

import { tableScrollWrapperPlugin } from '~/shared/ui/tableScrollWrapperPlugin';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './MidReportStructuredFields.css';

type TestCase = {
  id: string;
  description: string;
  input: string;
  output: string;
};

type TestCaseRow = TestCase & { index: number };
const ADD_ROW_ID = 'add-test-case';
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type MidReportEngineFieldsProps = {
  fields: DocumentEditorField[];
  isLocked: boolean;
  onFieldsChange: (fields: DocumentEditorField[]) => void;
};

function readCases(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as TestCase[]) : [];
  } catch {
    return [];
  }
}

function updateField(
  fields: DocumentEditorField[],
  key: string,
  value: string,
) {
  return fields.map(field => (field.key === key ? { ...field, value } : field));
}

export default function MidReportEngineFields({
  fields,
  isLocked,
  onFieldsChange,
}: MidReportEngineFieldsProps) {
  const testCasesField = fields.find(item => item.key === 'testCases');
  if (!testCasesField) return null;
  const testCases = readCases(testCasesField.value);
  const updateCases = (nextCases: TestCase[]) =>
    onFieldsChange(
      updateField(fields, testCasesField.key, JSON.stringify(nextCases)),
    );
  // The trailing row carries the add action where the next row will appear.
  const rows: TestCaseRow[] = [
    ...testCases.map((testCase, index) => ({ ...testCase, index })),
    { id: ADD_ROW_ID, index: -1, description: '', input: '', output: '' },
  ];

  return (
    <VStack gap={4}>
      {fields
        .filter(field => field.key !== 'testCases')
        .map(field => (
          <TextArea
            isDisabled={isLocked}
            key={field.key}
            label={field.label}
            onChange={value =>
              onFieldsChange(updateField(fields, field.key, value))
            }
            value={field.value}
          />
        ))}
      <div className={styles.tableWrapper}>
        <Table
          columns={[
            {
              align: 'start',
              header: '설명',
              key: 'description',
              renderCell: (row: TestCaseRow) =>
                row.index < 0 ? (
                  <Button
                    isDisabled={isLocked}
                    label='테스트 케이스 추가'
                    onClick={() =>
                      updateCases([
                        ...testCases,
                        {
                          id: createId(),
                          description: '',
                          input: '',
                          output: '',
                        },
                      ])
                    }
                    size='sm'
                    variant='secondary'
                  />
                ) : (
                  <TextArea
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`테스트 ${row.index + 1} 설명`}
                    onChange={value =>
                      updateCases(
                        testCases.map((item, index) =>
                          index === row.index
                            ? { ...item, description: value }
                            : item,
                        ),
                      )
                    }
                    rows={1}
                    value={row.description}
                    width='100%'
                  />
                ),
              width: proportional(1.4, { minWidth: 0 }),
            },
            {
              align: 'start',
              header: '입력값',
              key: 'input',
              renderCell: (row: TestCaseRow) =>
                row.index < 0 ? null : (
                  <TextArea
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`테스트 ${row.index + 1} 입력값`}
                    onChange={value =>
                      updateCases(
                        testCases.map((item, index) =>
                          index === row.index
                            ? { ...item, input: value }
                            : item,
                        ),
                      )
                    }
                    rows={1}
                    value={row.input}
                    width='100%'
                  />
                ),
              width: proportional(1, { minWidth: 0 }),
            },
            {
              align: 'start',
              header: '기대 출력값',
              key: 'output',
              renderCell: (row: TestCaseRow) =>
                row.index < 0 ? null : (
                  <TextArea
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`테스트 ${row.index + 1} 기대 출력값`}
                    onChange={value =>
                      updateCases(
                        testCases.map((item, index) =>
                          index === row.index
                            ? { ...item, output: value }
                            : item,
                        ),
                      )
                    }
                    rows={1}
                    value={row.output}
                    width='100%'
                  />
                ),
              width: proportional(1, { minWidth: 0 }),
            },
            {
              align: 'end',
              header: '관리',
              key: 'actions',
              renderCell: (row: TestCaseRow) =>
                row.index < 0 ? null : (
                  <Button
                    isDisabled={isLocked || testCases.length === 1}
                    label='삭제'
                    onClick={() =>
                      updateCases(
                        testCases.filter((_, index) => index !== row.index),
                      )
                    }
                    size='sm'
                    tooltip={
                      testCases.length === 1
                        ? '테스트 케이스는 최소 한 개가 필요해요.'
                        : undefined
                    }
                    variant='secondary'
                  />
                ),
              width: proportional(0.6, { minWidth: 0 }),
            },
          ]}
          data={rows}
          density='compact'
          dividers='grid'
          idKey='id'
          plugins={{ scrollWrapperLayout: tableScrollWrapperPlugin }}
          textOverflow='wrap'
          verticalAlign='top'
        />
      </div>
    </VStack>
  );
}
