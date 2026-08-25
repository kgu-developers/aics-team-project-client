import { Button, Text, TextArea, VStack } from '@aics/design-system';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './MidReportStructuredFields.css';

type TestCase = {
  id: string;
  description: string;
  input: string;
  output: string;
};

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
      <Text color='secondary'>
        입력과 기대 출력을 바로 붙여 넣을 수 있게 테스트 케이스별 텍스트로
        관리해요.
      </Text>
      {testCases.map((testCase, index) => (
        <div className={styles.row} key={testCase.id}>
          <TextArea
            isDisabled={isLocked}
            label={`테스트 ${index + 1} 설명`}
            onChange={description =>
              updateCases(
                testCases.map(item =>
                  item.id === testCase.id ? { ...item, description } : item,
                ),
              )
            }
            value={testCase.description}
          />
          <TextArea
            isDisabled={isLocked}
            label={`테스트 ${index + 1} 입력값`}
            onChange={input =>
              updateCases(
                testCases.map(item =>
                  item.id === testCase.id ? { ...item, input } : item,
                ),
              )
            }
            value={testCase.input}
          />
          <TextArea
            isDisabled={isLocked}
            label={`테스트 ${index + 1} 기대 출력값`}
            onChange={output =>
              updateCases(
                testCases.map(item =>
                  item.id === testCase.id ? { ...item, output } : item,
                ),
              )
            }
            value={testCase.output}
          />
          <Button
            clickAction={() =>
              updateCases(testCases.filter(item => item.id !== testCase.id))
            }
            isDisabled={isLocked || testCases.length === 1}
            label='테스트 삭제'
            size='sm'
            tooltip={
              testCases.length === 1
                ? '테스트 케이스는 최소 한 개가 필요해요.'
                : undefined
            }
            variant='secondary'
          />
        </div>
      ))}
      <Button
        clickAction={() =>
          updateCases([
            ...testCases,
            { id: crypto.randomUUID(), description: '', input: '', output: '' },
          ])
        }
        isDisabled={isLocked}
        label='테스트 케이스 추가'
        variant='secondary'
      />
    </VStack>
  );
}
