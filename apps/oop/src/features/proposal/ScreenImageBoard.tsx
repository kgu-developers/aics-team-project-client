import type {
  ProjectProposalResponse,
  ProposalScreenItem,
  UpdateProjectProposalInput,
} from '@aics/core';
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

import * as styles from './ProjectProposalFields.css';
import { useSubmitProjectImageMutation } from './queries';

type Props = {
  disabled: boolean;
  draft: UpdateProjectProposalInput;
  project: ProjectProposalResponse;
  onChange: (draft: UpdateProjectProposalInput) => void;
};
type Editing = {
  description: string;
  imageFileId: number | null;
  index: number | null;
  preview: string | null;
  title: string;
};
export default function ScreenImageBoard({
  disabled,
  draft,
  project,
  onChange,
}: Props) {
  const upload = useSubmitProjectImageMutation(String(project.teamId));
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
  const rows = draft.screenConfiguration;
  const imageUrl = (row: ProposalScreenItem) =>
    (row.imageFileId != null ? previews[row.imageFileId] : undefined) ??
    project.screenConfiguration.find(
      saved =>
        saved.imageFileId != null && saved.imageFileId === row.imageFileId,
    )?.imageUrl ??
    null;
  const closeDialog = () => {
    setEditing(null);
    upload.reset();
  };
  const commit = () => {
    if (!editing) return;
    const next: ProposalScreenItem = {
      description: editing.description,
      imageFileId: editing.imageFileId,
      title: editing.title,
    };
    onChange({
      ...draft,
      screenConfiguration:
        editing.index == null
          ? [...rows, next]
          : rows.map((row, i) =>
              i === editing.index ? { ...row, ...next } : row,
            ),
    });
    closeDialog();
  };
  return (
    <VStack gap={4}>
      <ul className={styles.screenList}>
        {rows.map((row, index) => {
          const url = imageUrl(row);
          const name = row.title?.trim() || `화면 ${index + 1}`;
          return (
            <li
              aria-label={`화면 ${index + 1}`}
              className={styles.screenCard}
              key={`${row.imageFileId ?? 'no-image'}:${index}`}
            >
              {url ? (
                <img alt={name} className={styles.image} src={url} />
              ) : (
                <Text color='secondary'>등록한 이미지가 없습니다.</Text>
              )}
              <Text weight='medium'>{name}</Text>
              <div className={styles.screenActions}>
                <Button
                  isDisabled={disabled}
                  label='편집'
                  onClick={() =>
                    setEditing({
                      description: row.description ?? '',
                      imageFileId: row.imageFileId ?? null,
                      index,
                      preview: url,
                      title: row.title ?? '',
                    })
                  }
                  size='sm'
                  variant='secondary'
                />
                <Button
                  isDisabled={disabled}
                  label='삭제'
                  onClick={() =>
                    onChange({
                      ...draft,
                      screenConfiguration: rows.filter((_, i) => i !== index),
                    })
                  }
                  size='sm'
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
            isDisabled={disabled}
            label='화면 이미지 추가'
            onClick={() =>
              setEditing({
                description: '',
                imageFileId: null,
                index: null,
                preview: null,
                title: '',
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
          <VStack className={styles.dialogForm} gap={4}>
            <Heading level={2}>
              {editing.index == null ? '화면 추가' : '화면 편집'}
            </Heading>
            <FileInput
              accept='image/*'
              isDisabled={disabled || upload.isPending}
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
                className={styles.image}
                src={editing.preview}
              />
            )}
            <TextInput
              isDisabled={disabled}
              label='제목'
              onChange={title =>
                setEditing(current =>
                  current ? { ...current, title } : current,
                )
              }
              value={editing.title}
              width='100%'
            />
            <TextArea
              isDisabled={disabled}
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
                isDisabled={
                  disabled || upload.isPending || editing.imageFileId == null
                }
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
