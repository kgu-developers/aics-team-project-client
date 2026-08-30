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
import { type ReactNode, useEffect, useState } from 'react';

import type { DocumentEditorField } from '~/features/editor/documentEditor';

import * as styles from './ProposalStructuredFields.css';

type DataRow = {
  id: string;
  name: string;
  description: string;
  count: number;
};

type SelectedImage = { file: File; url: string };

const dataColumnLabels = {
  actions: '관리',
  count: '예상 개수',
  description: '데이터 설명',
  name: '데이터 이름',
} as const;

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

function ResponsiveDataCell({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className={styles.responsiveCell} data-mobile-label={label}>
      {children}
    </div>
  );
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

  const updateRow = (rowId: string, patch: Partial<DataRow>) =>
    updateRows(
      rows.map(row => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  const removeRow = (rowId: string) =>
    updateRows(rows.filter(row => row.id !== rowId));

  return (
    <VStack className={styles.dataComposition} gap={4}>
      <div className={styles.tableWrapper}>
        <Table
          columns={[
            {
              align: 'start',
              header: dataColumnLabels.name,
              key: 'name',
              renderCell: row => (
                <ResponsiveDataCell label={dataColumnLabels.name}>
                  <TextInput
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`${row.id} ${dataColumnLabels.name}`}
                    onChange={name => updateRow(row.id, { name })}
                    value={row.name}
                    width='100%'
                  />
                </ResponsiveDataCell>
              ),
              width: proportional(1, { minWidth: 0 }),
            },
            {
              align: 'start',
              header: dataColumnLabels.description,
              key: 'description',
              renderCell: row => (
                <ResponsiveDataCell label={dataColumnLabels.description}>
                  <TextArea
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`${row.id} ${dataColumnLabels.description}`}
                    onChange={description => updateRow(row.id, { description })}
                    rows={1}
                    value={row.description}
                    width='100%'
                  />
                </ResponsiveDataCell>
              ),
              width: proportional(2, { minWidth: 0 }),
            },
            {
              align: 'start',
              header: dataColumnLabels.count,
              key: 'count',
              renderCell: row => (
                <ResponsiveDataCell label={dataColumnLabels.count}>
                  <TextInput
                    isDisabled={isLocked}
                    isLabelHidden
                    label={`${row.id} ${dataColumnLabels.count}`}
                    onChange={count =>
                      updateRow(row.id, {
                        count: Number(count.replace(/[^0-9]/g, '')) || 0,
                      })
                    }
                    value={String(row.count)}
                    width='100%'
                  />
                </ResponsiveDataCell>
              ),
              width: proportional(0.65, { minWidth: 0 }),
            },
            {
              align: 'end',
              header: dataColumnLabels.actions,
              key: 'actions',
              renderCell: row => (
                <ResponsiveDataCell label={dataColumnLabels.actions}>
                  <div className={styles.actionCell}>
                    <Button
                      clickAction={() => removeRow(row.id)}
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
                </ResponsiveDataCell>
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
      </div>
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
