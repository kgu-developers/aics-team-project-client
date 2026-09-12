import type { RequiredArtifactType } from '@aics/api-client';
import {
  Button,
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

import type { AdminRequiredArtifactDraft } from '../model';
import * as styles from './AdminRequiredArtifactDraftEditor.css';

type ArtifactForm = {
  allowedExtensions: string;
  clientId: string;
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

function createEmptyForm(clientId: string): ArtifactForm {
  return {
    allowedExtensions: '',
    clientId,
    label: '',
    maxFileSizeMb: '',
    required: true,
    type: 'TEXT',
  };
}

function toForm(draft: AdminRequiredArtifactDraft): ArtifactForm {
  return {
    allowedExtensions: draft.allowedExtensions?.join(', ') ?? '',
    clientId: draft.clientId,
    label: draft.label,
    maxFileSizeMb:
      draft.maxFileSizeMb === undefined ? '' : String(draft.maxFileSizeMb),
    required: draft.required,
    type: draft.type,
  };
}

function toDraft(form: ArtifactForm): AdminRequiredArtifactDraft {
  const label = form.label.trim();
  if (!label) throw new Error('산출물 이름을 입력해주세요.');

  if (form.type !== 'FILE') {
    return {
      clientId: form.clientId,
      label,
      required: form.required,
      type: form.type,
    };
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
    clientId: form.clientId,
    label,
    required: form.required,
    type: form.type,
  };
}

export default function AdminRequiredArtifactDraftEditor({
  onChange,
  value,
}: {
  onChange: (next: AdminRequiredArtifactDraft[]) => void;
  value: readonly AdminRequiredArtifactDraft[];
}) {
  const [editingId, setEditingId] = useState<string>();
  const [form, setForm] = useState<ArtifactForm>();
  const [error, setError] = useState<string>();

  const closeForm = () => {
    setEditingId(undefined);
    setError(undefined);
    setForm(undefined);
  };

  const openCreateForm = () => {
    setEditingId(undefined);
    setError(undefined);
    setForm(createEmptyForm(`artifact-${crypto.randomUUID()}`));
  };

  const openEditForm = (draft: AdminRequiredArtifactDraft) => {
    setEditingId(draft.clientId);
    setError(undefined);
    setForm(toForm(draft));
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    try {
      const nextDraft = toDraft(form);
      onChange(
        editingId
          ? value.map(draft =>
              draft.clientId === editingId ? nextDraft : draft,
            )
          : [...value, nextDraft],
      );
      closeForm();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '산출물 초안을 저장하지 못했습니다.',
      );
    }
  };

  return (
    <section
      aria-labelledby='artifact-drafts-heading'
      className={styles.section}
    >
      <div className={styles.heading}>
        <div>
          <Heading id='artifact-drafts-heading' level={2}>
            제출 산출물 초안
          </Heading>
          <Text color='secondary' type='supporting'>
            저장 후 선택한 각 분반의 마일스톤에 같은 산출물 규칙으로 등록됩니다.
          </Text>
        </div>
        <Button
          label='산출물 추가'
          onClick={openCreateForm}
          variant='secondary'
        />
      </div>

      {value.length === 0 ? (
        <EmptyState
          description='학생 제출에 필요한 파일, 링크 또는 텍스트 항목을 추가해주세요.'
          title='등록할 산출물이 없습니다.'
        />
      ) : (
        <div className={styles.list}>
          {value.map(draft => (
            <div className={styles.artifact} key={draft.clientId}>
              <div>
                <Text weight='medium'>{draft.label}</Text>
                <Text color='secondary' type='supporting'>
                  유형: {artifactTypeLabels[draft.type]} ·{' '}
                  {draft.required ? '필수 제출' : '선택 제출'}
                  {draft.type === 'FILE' ? (
                    <>
                      {' · '}허용 확장자:{' '}
                      {draft.allowedExtensions?.join(', ') || '제한 없음'}
                      {' · '}최대 용량: {draft.maxFileSizeMb ?? '제한 없음'}
                      {draft.maxFileSizeMb === undefined ? '' : 'MB'}
                    </>
                  ) : null}
                </Text>
              </div>
              <div className={styles.artifactActions}>
                <Button
                  label='수정'
                  onClick={() => openEditForm(draft)}
                  variant='secondary'
                />
                <Button
                  label='삭제'
                  onClick={() =>
                    onChange(
                      value.filter(
                        candidate => candidate.clientId !== draft.clientId,
                      ),
                    )
                  }
                  variant='secondary'
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        aria-label={editingId ? '산출물 초안 수정' : '산출물 초안 추가'}
        isOpen={Boolean(form)}
        onOpenChange={isOpen => {
          if (!isOpen) closeForm();
        }}
        purpose='form'
        width={680}
      >
        {form ? (
          <form className={styles.dialogForm} onSubmit={submitForm}>
            <Heading level={2}>
              {editingId ? '산출물 초안 수정' : '산출물 초안 추가'}
            </Heading>
            <TextInput
              isRequired
              label='산출물 이름'
              onChange={label =>
                setForm(current => (current ? { ...current, label } : current))
              }
              value={form.label}
              width='100%'
            />
            <Selector
              label='유형'
              onChange={type =>
                setForm(current =>
                  current
                    ? { ...current, type: type as RequiredArtifactType }
                    : current,
                )
              }
              options={(
                Object.keys(artifactTypeLabels) as RequiredArtifactType[]
              ).map(type => ({
                label: artifactTypeLabels[type],
                value: type,
              }))}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={form.type}
              width='100%'
            />
            <CheckboxList
              label='제출 여부'
              onChange={values =>
                setForm(current =>
                  current
                    ? { ...current, required: values.includes('required') }
                    : current,
                )
              }
              value={form.required ? ['required'] : []}
            >
              <CheckboxListItem
                description='학생이 제출을 완료하려면 이 항목이 필요합니다.'
                label='필수 제출'
                value='required'
              />
            </CheckboxList>
            {form.type === 'FILE' ? (
              <>
                <TextInput
                  description='쉼표로 구분해 입력합니다. 예: pdf, zip'
                  isOptional
                  label='허용 확장자'
                  onChange={allowedExtensions =>
                    setForm(current =>
                      current ? { ...current, allowedExtensions } : current,
                    )
                  }
                  value={form.allowedExtensions}
                  width='100%'
                />
                <label>
                  <Text weight='medium'>최대 파일 용량(MB)</Text>
                  <input
                    aria-label='최대 파일 용량(MB)'
                    className={styles.numberInput}
                    min='0'
                    onChange={event =>
                      setForm(current =>
                        current
                          ? { ...current, maxFileSizeMb: event.target.value }
                          : current,
                      )
                    }
                    step='1'
                    type='number'
                    value={form.maxFileSizeMb}
                  />
                </label>
              </>
            ) : null}
            {error ? <Text role='alert'>{error}</Text> : null}
            <div className={styles.dialogActions}>
              <Button label='취소' onClick={closeForm} variant='secondary' />
              <Button
                isDisabled={!form.label.trim()}
                label={editingId ? '저장' : '추가'}
                type='submit'
                variant='primary'
              />
            </div>
          </form>
        ) : null}
      </Dialog>
    </section>
  );
}
