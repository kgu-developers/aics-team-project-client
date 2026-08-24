import {
  Button,
  FileInput,
  proportional,
  Table,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './ProposalStructuredFields.css';

type DataRow = {
  id: string;
  name: string;
  description: string;
  count: number;
};

type SelectedImage = { file: File; url: string };

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type ProposalStructuredFieldsProps = {
  blockKey: string;
  fields: DocumentEditorField[];
  isLocked: boolean;
  onFieldsChange: (fields: DocumentEditorField[]) => void;
};

function readRows<T>(value: string, fallback: T[]) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function replaceField(
  fields: DocumentEditorField[],
  key: string,
  value: string,
) {
  return fields.map(field => (field.key === key ? { ...field, value } : field));
}

function DataCompositionFields({
  fields,
  isLocked,
  onFieldsChange,
}: Omit<ProposalStructuredFieldsProps, 'blockKey'>) {
  const field = fields.find(item => item.key === 'dataRows');
  if (!field) return null;
  const rows = readRows<DataRow>(field.value, []);
  const updateRows = (nextRows: DataRow[]) =>
    onFieldsChange(replaceField(fields, field.key, JSON.stringify(nextRows)));
  const totalCount = rows.reduce(
    (sum, row) => sum + (Number(row.count) || 0),
    0,
  );

  return (
    <VStack gap={4}>
      <Table
        columns={[
          {
            align: 'start',
            header: '데이터 이름',
            key: 'name',
            renderCell: row => (
              <TextInput
                isDisabled={isLocked}
                isLabelHidden
                label={`${row.id} 데이터 이름`}
                onChange={name =>
                  updateRows(
                    rows.map(item =>
                      item.id === row.id ? { ...item, name } : item,
                    ),
                  )
                }
                value={row.name}
              />
            ),
            width: proportional(1, { minWidth: 0 }),
          },
          {
            align: 'start',
            header: '데이터 설명',
            key: 'description',
            renderCell: row => (
              <TextArea
                isDisabled={isLocked}
                isLabelHidden
                label={`${row.id} 데이터 설명`}
                onChange={description =>
                  updateRows(
                    rows.map(item =>
                      item.id === row.id ? { ...item, description } : item,
                    ),
                  )
                }
                rows={1}
                value={row.description}
              />
            ),
            width: proportional(2, { minWidth: 0 }),
          },
          {
            align: 'start',
            header: '예상 개수',
            key: 'count',
            renderCell: row => (
              <TextInput
                isDisabled={isLocked}
                isLabelHidden
                label={`${row.id} 예상 개수`}
                onChange={count =>
                  updateRows(
                    rows.map(item =>
                      item.id === row.id
                        ? {
                            ...item,
                            count: Number(count.replace(/[^0-9]/g, '')) || 0,
                          }
                        : item,
                    ),
                  )
                }
                value={String(row.count)}
              />
            ),
            width: proportional(0.65, { minWidth: 0 }),
          },
          {
            align: 'end',
            header: '관리',
            key: 'actions',
            renderCell: row => (
              <div className={styles.actionCell}>
                <Button
                  clickAction={() =>
                    updateRows(rows.filter(item => item.id !== row.id))
                  }
                  isDisabled={isLocked || rows.length === 1}
                  label='삭제'
                  size='sm'
                  tooltip={
                    rows.length === 1
                      ? '데이터 항목은 최소 한 개가 필요해요.'
                      : undefined
                  }
                  variant='secondary'
                />
              </div>
            ),
            width: proportional(0.45, { minWidth: 0 }),
          },
        ]}
        data={rows}
        density='compact'
        dividers='grid'
        idKey='id'
        textOverflow='wrap'
        verticalAlign='top'
      />
      <Button
        clickAction={() =>
          updateRows([
            ...rows,
            { id: createId(), name: '', description: '', count: 0 },
          ])
        }
        isDisabled={isLocked}
        label='데이터 추가'
        variant='secondary'
      />
      <div className={styles.summary}>
        <Text weight='medium'>예상 총 데이터 수</Text>
        <Text weight='bold'>{totalCount.toLocaleString('ko-KR')}건</Text>
      </div>
    </VStack>
  );
}

function ScreenCompositionFields({
  fields,
  isLocked,
  onFieldsChange,
}: Omit<ProposalStructuredFieldsProps, 'blockKey'>) {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const descriptionField = fields.find(
    item => item.key === 'screenDescription',
  );
  const imageNamesField = fields.find(
    item => item.key === 'wireframeImageNames',
  );

  useEffect(
    () => () => selectedImages.forEach(image => URL.revokeObjectURL(image.url)),
    [selectedImages],
  );

  if (!descriptionField || !imageNamesField) return null;
  const savedNames = readRows<string>(imageNamesField.value, []);

  return (
    <VStack gap={4}>
      <FileInput
        accept='image/*'
        isDisabled={isLocked}
        isMultiple
        label='와이어프레임 이미지'
        maxFiles={8}
        mode='dropzone'
        onChange={value => {
          const nextFiles = Array.isArray(value) ? value : value ? [value] : [];
          setSelectedImages(
            nextFiles.map(file => ({ file, url: URL.createObjectURL(file) })),
          );
          onFieldsChange(
            replaceField(
              fields,
              imageNamesField.key,
              JSON.stringify(nextFiles.map(file => file.name)),
            ),
          );
        }}
        placeholder='이미지를 끌어 놓거나 눌러서 선택하세요.'
        value={selectedImages.map(image => image.file)}
        width='100%'
      />
      {selectedImages.length > 0 ? (
        <div className={styles.imagePreviewGrid}>
          {selectedImages.map(image => (
            <img
              alt={`${image.file.name} 미리보기`}
              key={image.url}
              src={image.url}
            />
          ))}
        </div>
      ) : null}
      {savedNames.length > 0 ? (
        <Text color='secondary' type='supporting'>
          선택한 이미지: {savedNames.join(', ')}
        </Text>
      ) : null}
      <TextArea
        isDisabled={isLocked}
        label='화면 구성 설명'
        onChange={value =>
          onFieldsChange(replaceField(fields, descriptionField.key, value))
        }
        value={descriptionField.value}
      />
    </VStack>
  );
}

export default function ProposalStructuredFields({
  blockKey,
  fields,
  isLocked,
  onFieldsChange,
}: ProposalStructuredFieldsProps) {
  if (blockKey === 'data-composition')
    return (
      <DataCompositionFields
        fields={fields}
        isLocked={isLocked}
        onFieldsChange={onFieldsChange}
      />
    );
  if (blockKey === 'screen-composition')
    return (
      <ScreenCompositionFields
        fields={fields}
        isLocked={isLocked}
        onFieldsChange={onFieldsChange}
      />
    );
  return null;
}
