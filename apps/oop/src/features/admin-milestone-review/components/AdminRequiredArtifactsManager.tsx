import type {
  RequiredArtifactDto,
  RequiredArtifactInput,
  RequiredArtifactType,
} from '@aics/api-client';
import {
  Button,
  Card,
  CheckboxList,
  CheckboxListItem,
  Dialog,
  EmptyState,
  Heading,
  Selector,
  SelectorOption,
  Text,
  TextInput,
} from '@aics/design-system';
import { useState, type FormEvent } from 'react';

import {
  useAdminRequiredArtifactsQuery,
  useRemoveRequiredArtifactMutation,
  useSubmitRequiredArtifactMutation,
  useUpdateRequiredArtifactMutation,
} from '../queries';
import * as styles from './AdminRequiredArtifactsManager.css';

type ArtifactForm = {
  allowedExtensions: string;
  label: string;
  maxFileSizeMb: string;
  required: boolean;
  type: RequiredArtifactType;
};

const artifactTypeLabels: Record<RequiredArtifactType, string> = {
  CHEERPJ_RUN: 'CheerpJ 실행',
  FILE: '파일',
  LINK: '링크',
  TEXT: '텍스트',
};

const emptyForm: ArtifactForm = {
  allowedExtensions: '',
  label: '',
  maxFileSizeMb: '',
  required: true,
  type: 'FILE',
};

function createArtifactInput(form: ArtifactForm): RequiredArtifactInput {
  const label = form.label.trim();
  if (!label) throw new Error('산출물 이름을 입력해주세요.');

  if (form.type !== 'FILE') {
    return { label, required: form.required, type: form.type };
  }

  const allowedExtensions = form.allowedExtensions
    .split(',')
    .map(extension => extension.trim())
    .filter(Boolean);
  const maxFileSizeMb = form.maxFileSizeMb.trim()
    ? Number(form.maxFileSizeMb)
    : undefined;

  if (
    maxFileSizeMb !== undefined &&
    (!Number.isInteger(maxFileSizeMb) || maxFileSizeMb < 0)
  ) {
    throw new Error('최대 파일 용량은 0 이상의 정수(MB)로 입력해주세요.');
  }

  return {
    ...(allowedExtensions.length > 0 ? { allowedExtensions } : {}),
    ...(maxFileSizeMb !== undefined ? { maxFileSizeMb } : {}),
    label,
    required: form.required,
    type: form.type,
  };
}

function toArtifactForm(artifact: RequiredArtifactDto): ArtifactForm {
  return {
    allowedExtensions: artifact.allowedExtensions?.join(', ') ?? '',
    label: artifact.label ?? '',
    maxFileSizeMb:
      artifact.maxFileSizeMb === undefined
        ? ''
        : String(artifact.maxFileSizeMb),
    required: artifact.required ?? false,
    type: artifact.type ?? 'FILE',
  };
}

export default function AdminRequiredArtifactsManager({
  milestoneId,
  sectionId,
}: {
  milestoneId: string;
  sectionId: string;
}) {
  const artifactsQuery = useAdminRequiredArtifactsQuery(sectionId, milestoneId);
  const submitMutation = useSubmitRequiredArtifactMutation();
  const updateMutation = useUpdateRequiredArtifactMutation();
  const removeMutation = useRemoveRequiredArtifactMutation();
  const [form, setForm] = useState<ArtifactForm>(emptyForm);
  const [editingArtifact, setEditingArtifact] =
    useState<RequiredArtifactDto | null>(null);
  const [deletingArtifact, setDeletingArtifact] =
    useState<RequiredArtifactDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string>();

  const isPending =
    submitMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;
  const artifacts = artifactsQuery.data?.contents ?? [];

  const closeForm = () => {
    if (isPending) return;
    setError(undefined);
    setEditingArtifact(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setError(undefined);
    setEditingArtifact(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (artifact: RequiredArtifactDto) => {
    setError(undefined);
    setEditingArtifact(artifact);
    setForm(toArtifactForm(artifact));
    setIsFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) return;

    try {
      const input = createArtifactInput(form);
      if (editingArtifact) {
        await updateMutation.mutateAsync({
          input,
          milestoneId,
          requiredArtifactId: String(editingArtifact.id),
          sectionId,
        });
      } else {
        await submitMutation.mutateAsync({ input, milestoneId, sectionId });
      }
      closeForm();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '산출물을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  };

  const confirmRemove = async () => {
    if (!deletingArtifact || isPending) return;
    setError(undefined);

    try {
      await removeMutation.mutateAsync({
        milestoneId,
        requiredArtifactId: String(deletingArtifact.id),
        sectionId,
      });
      setDeletingArtifact(null);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '산출물을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.',
      );
    }
  };

  return (
    <section
      aria-labelledby='required-artifacts-heading'
      className={styles.section}
    >
      <div className={styles.heading}>
        <div>
          <Heading id='required-artifacts-heading' level={2}>
            필수 산출물 관리
          </Heading>
          <Text color='secondary' type='supporting'>
            학생 제출 화면에 표시할 산출물 규칙을 관리합니다.
          </Text>
        </div>
        <Button
          isDisabled={isPending || artifactsQuery.isPending}
          label='산출물 추가'
          onClick={openCreateForm}
          variant='secondary'
        />
      </div>

      {artifactsQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          필수 산출물을 불러오는 중입니다.
        </Text>
      ) : artifactsQuery.isError ? (
        <EmptyState
          description='네트워크 상태를 확인한 뒤 다시 시도해주세요.'
          title='필수 산출물을 불러오지 못했습니다.'
        />
      ) : artifacts.length === 0 ? (
        <EmptyState
          description='학생 제출에 필요한 파일, 링크 또는 텍스트 항목을 추가해주세요.'
          title='등록된 필수 산출물이 없습니다.'
        />
      ) : (
        <div className={styles.list}>
          {artifacts.map(artifact => (
            <Card className={styles.artifact} key={artifact.id} padding={0}>
              <div className={styles.artifactHeader}>
                <div>
                  <Heading level={3}>
                    {artifact.label ?? '이름 없는 산출물'}
                  </Heading>
                  <Text className={styles.artifactMeta} type='supporting'>
                    유형:{' '}
                    {artifact.type ? artifactTypeLabels[artifact.type] : '-'}
                    {' · '}
                    {artifact.required ? '필수 제출' : '선택 제출'}
                  </Text>
                </div>
                <div className={styles.actions}>
                  <Button
                    isDisabled={isPending}
                    label='수정'
                    onClick={() => openEditForm(artifact)}
                    variant='secondary'
                  />
                  <Button
                    isDisabled={isPending}
                    label='삭제'
                    onClick={() => setDeletingArtifact(artifact)}
                    variant='secondary'
                  />
                </div>
              </div>
              {artifact.type === 'FILE' ? (
                <Text color='secondary' type='supporting'>
                  허용 확장자:{' '}
                  {artifact.allowedExtensions?.join(', ') || '제한 없음'}
                  {' · '}최대 용량: {artifact.maxFileSizeMb ?? '제한 없음'}
                  {artifact.maxFileSizeMb === undefined ? '' : 'MB'}
                </Text>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      {error ? (
        <Text className={styles.error} role='alert'>
          {error}
        </Text>
      ) : null}

      <Dialog
        aria-label={editingArtifact ? '필수 산출물 수정' : '필수 산출물 추가'}
        isOpen={isFormOpen}
        onOpenChange={isOpen => {
          if (!isOpen) closeForm();
        }}
        purpose='form'
        width={680}
      >
        <form className={styles.dialogForm} onSubmit={submitForm}>
          <Heading level={2}>
            {editingArtifact ? '필수 산출물 수정' : '필수 산출물 추가'}
          </Heading>
          <TextInput
            isDisabled={isPending}
            isRequired
            label='산출물 이름'
            onChange={label => setForm(current => ({ ...current, label }))}
            value={form.label}
            width='100%'
          />
          <Selector
            isDisabled={isPending}
            label='유형'
            onChange={type =>
              setForm(current => ({
                ...current,
                type: type as RequiredArtifactType,
              }))
            }
            options={(
              Object.keys(artifactTypeLabels) as RequiredArtifactType[]
            ).map(type => ({ label: artifactTypeLabels[type], value: type }))}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={form.type}
            width='100%'
          />
          <CheckboxList
            label='제출 여부'
            onChange={values =>
              setForm(current => ({
                ...current,
                required: values.includes('required'),
              }))
            }
            value={form.required ? ['required'] : []}
          >
            <CheckboxListItem
              description='학생이 제출을 완료하려면 이 항목이 필요합니다.'
              isDisabled={isPending}
              label='필수 제출'
              value='required'
            />
          </CheckboxList>
          {form.type === 'FILE' ? (
            <>
              <TextInput
                description='쉼표로 구분해 입력합니다. 예: pdf, zip'
                isDisabled={isPending}
                isOptional
                label='허용 확장자'
                onChange={allowedExtensions =>
                  setForm(current => ({ ...current, allowedExtensions }))
                }
                value={form.allowedExtensions}
                width='100%'
              />
              <label>
                <Text weight='medium'>최대 파일 용량(MB)</Text>
                <input
                  aria-label='최대 파일 용량(MB)'
                  className={styles.numberInput}
                  disabled={isPending}
                  min='0'
                  onChange={event =>
                    setForm(current => ({
                      ...current,
                      maxFileSizeMb: event.target.value,
                    }))
                  }
                  step='1'
                  type='number'
                  value={form.maxFileSizeMb}
                />
              </label>
            </>
          ) : null}
          <div className={styles.dialogActions}>
            <Button
              isDisabled={isPending}
              label='취소'
              onClick={closeForm}
              variant='secondary'
            />
            <Button
              isDisabled={isPending || !form.label.trim()}
              isLoading={isPending}
              label={editingArtifact ? '저장' : '추가'}
              type='submit'
              variant='primary'
            />
          </div>
        </form>
      </Dialog>

      <Dialog
        aria-label='필수 산출물 삭제'
        isOpen={Boolean(deletingArtifact)}
        onOpenChange={isOpen => {
          if (!isOpen && !isPending) setDeletingArtifact(null);
        }}
        purpose='required'
        width={440}
      >
        <div className={styles.dialogForm}>
          <Heading level={2}>필수 산출물을 삭제할까요?</Heading>
          <Text>
            삭제한 규칙은 이후 제출 검증과 목록에서 제외됩니다. 기존 제출 이력은
            유지됩니다.
          </Text>
          <div className={styles.dialogActions}>
            <Button
              isDisabled={isPending}
              label='취소'
              onClick={() => setDeletingArtifact(null)}
              variant='secondary'
            />
            <Button
              isDisabled={isPending}
              isLoading={removeMutation.isPending}
              label='삭제'
              onClick={confirmRemove}
              variant='primary'
            />
          </div>
        </div>
      </Dialog>
    </section>
  );
}
