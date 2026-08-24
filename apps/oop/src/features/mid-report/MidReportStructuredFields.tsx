import {
  Button,
  FileInput,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useState } from 'react';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './MidReportStructuredFields.css';

type GuiScreenRow = {
  id: string;
  name: string;
  description: string;
  imageName?: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type MidReportStructuredFieldsProps = {
  fields: DocumentEditorField[];
  isLocked: boolean;
  onFieldsChange: (fields: DocumentEditorField[]) => void;
};

function readRows(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as GuiScreenRow[]) : [];
  } catch {
    return [];
  }
}

export default function MidReportStructuredFields({
  fields,
  isLocked,
  onFieldsChange,
}: MidReportStructuredFieldsProps) {
  const [selectedImages, setSelectedImages] = useState<Record<string, File>>(
    {},
  );
  const field = fields.find(item => item.key === 'guiScreens');
  if (!field) return null;
  const rows = readRows(field.value);
  const updateRows = (nextRows: GuiScreenRow[]) =>
    onFieldsChange(
      fields.map(item =>
        item.key === field.key
          ? { ...item, value: JSON.stringify(nextRows) }
          : item,
      ),
    );

  return (
    <VStack gap={4}>
      <Text color='secondary'>
        화면 하나마다 이름과 그 화면에서 제공하는 기능·사용자 행동을 한 세트로
        작성해요.
      </Text>
      {rows.map((row, index) => (
        <div className={styles.row} key={row.id}>
          <TextInput
            isDisabled={isLocked}
            label={`화면 ${index + 1} 이름`}
            onChange={name =>
              updateRows(
                rows.map(item =>
                  item.id === row.id ? { ...item, name } : item,
                ),
              )
            }
            value={row.name}
          />
          <TextArea
            isDisabled={isLocked}
            label={`화면 ${index + 1} 설명`}
            onChange={description =>
              updateRows(
                rows.map(item =>
                  item.id === row.id ? { ...item, description } : item,
                ),
              )
            }
            value={row.description}
          />
          <FileInput
            accept='image/*'
            isDisabled={isLocked}
            label={`화면 ${index + 1} 이미지`}
            onChange={value => {
              const file = Array.isArray(value) ? value[0] : value;
              setSelectedImages(current =>
                file
                  ? { ...current, [row.id]: file }
                  : Object.fromEntries(
                      Object.entries(current).filter(([id]) => id !== row.id),
                    ),
              );
              updateRows(
                rows.map(item =>
                  item.id === row.id
                    ? { ...item, imageName: file?.name }
                    : item,
                ),
              );
            }}
            placeholder='화면 이미지를 선택하세요.'
            value={selectedImages[row.id] ?? null}
            width='100%'
          />
          <Button
            isDisabled={isLocked || rows.length === 1}
            label='화면 삭제'
            clickAction={() =>
              updateRows(rows.filter(item => item.id !== row.id))
            }
            size='sm'
            tooltip={
              rows.length === 1
                ? '화면 항목은 최소 한 개가 필요해요.'
                : undefined
            }
            variant='secondary'
          />
        </div>
      ))}
      <Button
        isDisabled={isLocked}
        label='화면 추가'
        clickAction={() =>
          updateRows([...rows, { id: createId(), name: '', description: '' }])
        }
        variant='secondary'
      />
    </VStack>
  );
}
