import {
  Button,
  Dialog,
  FileInput,
  Heading,
  IconButton,
  Text,
  TextArea,
  TextInput,
  VStack,
} from '@aics/design-system';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import type { DocumentEditorField } from '~/features/editor/documentEditor';
import { useSubmitProjectImageMutation } from '~/features/editor/queries';

import * as styles from './MidReportStructuredFields.css';

export type GuiScreenRow = {
  id: string;
  name: string;
  description: string;
  imageName?: string;
  imageFileId?: number;
  imageUrl?: string;
};
type Editing = {
  description: string;
  imageFileId?: number;
  index: number | null;
  name: string;
  preview: string | null;
};
type Props = {
  fields: DocumentEditorField[];
  isLocked: boolean;
  onFieldsChange: (fields: DocumentEditorField[]) => void;
};
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
function readRows(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as GuiScreenRow[]) : [];
  } catch {
    return [];
  }
}
function savedImageUrl(row: GuiScreenRow) {
  return row.imageUrl && /^(https?:\/\/|\/(?!\/))/.test(row.imageUrl)
    ? row.imageUrl
    : null;
}
export default function MidReportGuiScreens({
  fields,
  isLocked,
  onFieldsChange,
}: Props) {
  const teamId = useAuthStore(state => state.currentUser?.teamId ?? '');
  // The upload endpoint is team scoped and takes a numeric team ID.
  const canUploadImage = /^[1-9]\d*$/.test(teamId);
  const upload = useSubmitProjectImageMutation(teamId);
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<Editing | null>(null);
  const previewsRef = useRef(previews);
  previewsRef.current = previews;
  useEffect(
    () => () => {
      Object.values(previewsRef.current).forEach(url =>
        URL.revokeObjectURL(url),
      );
    },
    [],
  );
  const field = fields.find(item => item.key === 'guiScreens');
  const rows = field ? readRows(field.value) : [];
  const usedFileIdKey = [
    ...rows.flatMap(row => (row.imageFileId == null ? [] : [row.imageFileId])),
    ...(editing?.imageFileId == null ? [] : [editing.imageFileId]),
  ].join(',');
  useEffect(() => {
    // Cancelled, replaced, and deleted uploads leave their object URL behind.
    const used = new Set(usedFileIdKey ? usedFileIdKey.split(',') : []);
    setPreviews(current => {
      const stale = Object.keys(current).filter(id => !used.has(id));
      if (!stale.length) return current;
      const next = { ...current };
      stale.forEach(id => {
        URL.revokeObjectURL(next[Number(id)]!);
        delete next[Number(id)];
      });
      return next;
    });
  }, [usedFileIdKey]);
  if (!field) return null;
  const updateRows = (nextRows: GuiScreenRow[]) =>
    onFieldsChange(
      fields.map(item =>
        item.key === field.key
          ? { ...item, value: JSON.stringify(nextRows) }
          : item,
      ),
    );
  const imageOf = (row: GuiScreenRow) =>
    (row.imageFileId == null ? undefined : previews[row.imageFileId]) ??
    savedImageUrl(row);
  const closeDialog = () => {
    setEditing(null);
    upload.reset();
  };
  const commit = () => {
    if (!editing) return;
    const next = {
      description: editing.description,
      name: editing.name,
      ...(editing.imageFileId == null
        ? {}
        : { imageFileId: editing.imageFileId }),
    };
    updateRows(
      editing.index == null
        ? [...rows, { id: createId(), ...next }]
        : rows.map((row, index) =>
            index === editing.index ? { ...row, ...next } : row,
          ),
    );
    closeDialog();
  };
  return (
    <VStack gap={4}>
      <Text color='secondary'>
        화면 하나마다 이름과 그 화면에서 제공하는 기능·사용자 행동을 한 세트로
        작성해요.
      </Text>
      <ul className={styles.screenList}>
        {rows.map((row, index) => {
          const url = imageOf(row);
          const label = row.name.trim() || `화면 ${index + 1}`;
          return (
            <li
              aria-label={`화면 ${index + 1}`}
              className={styles.screenCard}
              key={row.id}
            >
              {url ? (
                <img alt={label} className={styles.imagePreview} src={url} />
              ) : (
                <Text color='secondary'>등록한 이미지가 없습니다.</Text>
              )}
              <Text weight='medium'>{label}</Text>
              <div className={styles.screenActions}>
                <Button
                  isDisabled={isLocked}
                  label='편집'
                  onClick={() =>
                    setEditing({
                      description: row.description,
                      ...(row.imageFileId == null
                        ? {}
                        : { imageFileId: row.imageFileId }),
                      index,
                      name: row.name,
                      preview: url,
                    })
                  }
                  size='sm'
                  variant='secondary'
                />
                <Button
                  isDisabled={isLocked || rows.length === 1}
                  label='삭제'
                  onClick={() =>
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
            </li>
          );
        })}
        <li className={styles.screenAddCell}>
          <IconButton
            className={styles.screenAddButton}
            icon={<Plus aria-hidden='true' size={20} />}
            isDisabled={isLocked}
            label='화면 이미지 추가'
            onClick={() =>
              setEditing({
                description: '',
                index: null,
                name: '',
                preview: null,
              })
            }
          />
        </li>
      </ul>
      <Dialog
        aria-label={editing?.index == null ? '화면 추가' : '화면 편집'}
        isOpen={editing != null}
        onOpenChange={next => {
          if (!next && !upload.isPending) closeDialog();
        }}
        purpose='form'
        width={520}
      >
        {editing && (
          <VStack gap={4}>
            <Heading level={2}>
              {editing.index == null ? '화면 추가' : '화면 편집'}
            </Heading>
            <FileInput
              accept='image/*'
              isDisabled={isLocked || upload.isPending || !canUploadImage}
              label='화면 이미지'
              onChange={selected => {
                const file = Array.isArray(selected) ? selected[0] : selected;
                if (!file) return;
                upload.mutate(file, {
                  onSuccess: ({ fileId }) => {
                    const preview = URL.createObjectURL(file);
                    setPreviews(current => ({ ...current, [fileId]: preview }));
                    setEditing(current =>
                      current
                        ? { ...current, imageFileId: fileId, preview }
                        : current,
                    );
                  },
                });
              }}
              placeholder='이미지를 끌어 놓거나 눌러서 선택하세요.'
              value={null}
              width='100%'
            />
            {!canUploadImage && (
              <Text color='secondary'>
                팀 정보를 확인한 뒤에 이미지를 올릴 수 있어요.
              </Text>
            )}
            {upload.isPending && (
              <Text role='status'>이미지를 올리는 중이에요.</Text>
            )}
            {upload.isError && (
              <Text role='alert'>
                이미지를 올리지 못했어요. 입력 내용은 그대로 두고 다시 시도해
                주세요.
              </Text>
            )}
            {editing.preview && (
              <img
                alt='선택한 화면 이미지'
                className={styles.imagePreview}
                src={editing.preview}
              />
            )}
            <TextInput
              isDisabled={isLocked}
              label='이름'
              onChange={name =>
                setEditing(current =>
                  current ? { ...current, name } : current,
                )
              }
              value={editing.name}
              width='100%'
            />
            <TextArea
              isDisabled={isLocked}
              label='설명'
              onChange={description =>
                setEditing(current =>
                  current ? { ...current, description } : current,
                )
              }
              value={editing.description}
              width='100%'
            />
            <div className={styles.screenActions}>
              <Button
                isDisabled={isLocked || upload.isPending}
                label={editing.index == null ? '추가' : '적용'}
                onClick={commit}
              />
              <Button
                isDisabled={upload.isPending}
                label='취소'
                onClick={closeDialog}
                variant='secondary'
              />
            </div>
          </VStack>
        )}
      </Dialog>
    </VStack>
  );
}
