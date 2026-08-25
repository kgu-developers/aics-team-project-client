import { Button, Text, TextArea, TextInput, VStack } from '@aics/design-system';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './PresentationStructuredFields.css';

type PresentationItem = {
  id: string;
  name: string;
  description: string;
};

type PresentationStructuredFieldsProps = {
  fields: DocumentEditorField[];
  isLocked: boolean;
  onFieldsChange: (fields: DocumentEditorField[]) => void;
  kind: 'features' | 'screens';
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function readItems(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as PresentationItem[]) : [];
  } catch {
    return [];
  }
}

export default function PresentationStructuredFields({
  fields,
  isLocked,
  onFieldsChange,
  kind,
}: PresentationStructuredFieldsProps) {
  const fieldKey = kind === 'features' ? 'featureItems' : 'screenItems';
  const field = fields.find(item => item.key === fieldKey);
  if (!field) return null;
  const items = readItems(field.value);
  const itemLabel = kind === 'features' ? '기능' : '화면';
  const updateItems = (nextItems: PresentationItem[]) =>
    onFieldsChange(
      fields.map(item =>
        item.key === fieldKey
          ? { ...item, value: JSON.stringify(nextItems) }
          : item,
      ),
    );

  return (
    <VStack gap={4}>
      <Text color='secondary'>
        {kind === 'features'
          ? '엔진부의 핵심 기능을 하나씩 분리해 발표 맥락과 동작을 설명해요.'
          : '발표에서 보여줄 화면을 하나씩 분리해 사용자 행동과 역할을 설명해요.'}
      </Text>
      {items.map((item, index) => (
        <div className={styles.row} key={item.id}>
          <TextInput
            isDisabled={isLocked}
            label={`${itemLabel} ${index + 1} 이름`}
            onChange={name =>
              updateItems(
                items.map(current =>
                  current.id === item.id ? { ...current, name } : current,
                ),
              )
            }
            value={item.name}
          />
          <TextArea
            isDisabled={isLocked}
            label={`${itemLabel} ${index + 1} 설명`}
            onChange={description =>
              updateItems(
                items.map(current =>
                  current.id === item.id
                    ? { ...current, description }
                    : current,
                ),
              )
            }
            value={item.description}
          />
          <Button
            clickAction={() =>
              updateItems(items.filter(current => current.id !== item.id))
            }
            isDisabled={isLocked || items.length === 1}
            label={`${itemLabel} 삭제`}
            size='sm'
            tooltip={
              items.length === 1
                ? `${itemLabel} 항목은 최소 한 개가 필요해요.`
                : undefined
            }
            variant='secondary'
          />
        </div>
      ))}
      <Button
        clickAction={() =>
          updateItems([...items, { id: createId(), name: '', description: '' }])
        }
        isDisabled={isLocked}
        label={`${itemLabel} 추가`}
        variant='secondary'
      />
    </VStack>
  );
}
