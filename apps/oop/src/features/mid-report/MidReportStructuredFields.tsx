import { Button, Text, TextArea, TextInput, VStack } from '@aics/design-system';
import { useState } from 'react';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './MidReportStructuredFields.css';

type GuiScreenRow = {
  id: string;
  name: string;
  description: string;
  imageName?: string;
  imageFileId?: number;
  imageUrl?: string;
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
  const [imageIds, setImageIds] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState<string | null>(null);
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
      {imageError ? <p role='alert'>{imageError}</p> : null}
      <Text color='secondary'>
        팀원이 업로드한 이미지 파일 ID를 연결할 수 있어요.
      </Text>
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
          <TextInput
            isDisabled={isLocked}
            label={`화면 ${index + 1} 이미지 파일 ID`}
            value={imageIds[row.id] ?? String(row.imageFileId ?? '')}
            onChange={value =>
              setImageIds(current => ({ ...current, [row.id]: value }))
            }
          />
          <Button
            label='이미지 연결'
            variant='secondary'
            isDisabled={isLocked}
            onClick={() => {
              const input = imageIds[row.id] ?? String(row.imageFileId ?? '');
              const imageFileId = Number(input);
              if (
                !/^[1-9]\d*$/.test(input) ||
                !Number.isSafeInteger(imageFileId)
              ) {
                setImageError(
                  '이미지 파일 ID는 1 이상의 정수로 입력해 주세요.',
                );
                return;
              }
              setImageError(null);
              updateRows(
                rows.map(item =>
                  item.id === row.id
                    ? {
                        id: item.id,
                        name: item.name,
                        description: item.description,
                        imageFileId,
                      }
                    : item,
                ),
              );
            }}
          />
          {row.imageFileId ? (
            <>
              <Text color='secondary'>
                {row.imageName ?? `이미지 파일 ${row.imageFileId}`}
              </Text>
              {row.imageUrl && /^(https?:\/\/|\/(?!\/))/.test(row.imageUrl) ? (
                <img
                  className={styles.imagePreview}
                  src={row.imageUrl}
                  alt={`${row.name || `화면 ${index + 1}`} 설계 이미지`}
                />
              ) : null}
              <Button
                label='이미지 연결 해제'
                variant='secondary'
                isDisabled={isLocked}
                onClick={() => {
                  setImageIds(current => ({ ...current, [row.id]: '' }));
                  updateRows(
                    rows.map(item =>
                      item.id === row.id
                        ? {
                            id: item.id,
                            name: item.name,
                            description: item.description,
                          }
                        : item,
                    ),
                  );
                }}
              />
            </>
          ) : null}
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
