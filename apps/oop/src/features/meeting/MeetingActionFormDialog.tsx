import {
  Button,
  DateInput,
  Dialog,
  Heading,
  Selector,
  Text,
  TextInput,
} from '@aics/design-system';

import * as styles from './MeetingActionFormDialog.css';

export type ActionFormState = {
  assigneeUserId: string;
  content: string;
  dueDate: string;
  meetingId: string;
};

export default function MeetingActionFormDialog({
  error,
  isUncertain,
  form,
  isOpen,
  isPending,
  meetings,
  mode,
  onClose,
  onSubmit,
  setForm,
  teamMembers,
}: {
  error?: string;
  isUncertain: boolean;
  form: ActionFormState;
  isOpen: boolean;
  isPending: boolean;
  meetings: { id: string; title: string }[];
  mode: 'add' | 'edit';
  onClose: () => void;
  onSubmit: () => void;
  setForm: (next: ActionFormState) => void;
  teamMembers: { id: string; name: string }[];
}) {
  const isInvalid = !form.content.trim() || !form.meetingId;

  return (
    <Dialog
      aria-label={mode === 'add' ? '액션 플랜 추가' : '액션 플랜 수정'}
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen && !isPending) onClose();
      }}
      purpose='form'
      width={520}
    >
      <form
        className={styles.dialogForm}
        onSubmit={event => {
          event.preventDefault();
          if (!isInvalid && !isPending && !isUncertain) onSubmit();
        }}
      >
        <Heading level={2}>
          {mode === 'add' ? '액션 플랜 추가' : '액션 플랜 수정'}
        </Heading>
        <Selector
          isDisabled={mode === 'edit' || isPending}
          isRequired
          label='회의록'
          onChange={meetingId => setForm({ ...form, meetingId })}
          options={meetings.map(record => ({
            label: record.title,
            value: record.id,
          }))}
          value={form.meetingId}
          width='100%'
        />
        <TextInput
          isDisabled={isPending}
          isRequired
          label='액션 항목'
          onChange={content => setForm({ ...form, content })}
          placeholder='실행할 액션을 입력해 주세요.'
          value={form.content}
          width='100%'
        />
        <Selector
          isDisabled={isPending}
          label='담당자'
          onChange={assigneeUserId => setForm({ ...form, assigneeUserId })}
          options={[
            { label: '미정', value: '' },
            ...teamMembers.map(member => ({
              label: member.name,
              value: member.id,
            })),
          ]}
          value={form.assigneeUserId}
          width='100%'
        />
        <DateInput
          hasClear
          isDisabled={isPending}
          isOptional
          label='기한'
          onChange={dueDate => setForm({ ...form, dueDate: dueDate ?? '' })}
          placeholder='기한 선택'
          value={
            form.dueDate
              ? (form.dueDate as `${number}${number}${number}${number}-${number}${number}-${number}${number}`)
              : undefined
          }
          width='100%'
        />
        {mode === 'add' ? (
          <Text color='secondary' type='supporting'>
            새 액션 플랜은 ‘시작 전’ 상태로 추가되며, 추가 후 상태를 변경할 수
            있어요.
          </Text>
        ) : null}
        {error ? <p role='alert'>{error}</p> : null}
        <div className={styles.dialogActions}>
          <Button
            isDisabled={isPending}
            label='취소'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            isDisabled={isInvalid || isPending || isUncertain}
            isLoading={isPending}
            label={mode === 'add' ? '추가' : '저장'}
            type='submit'
            variant='primary'
          />
        </div>
      </form>
    </Dialog>
  );
}
