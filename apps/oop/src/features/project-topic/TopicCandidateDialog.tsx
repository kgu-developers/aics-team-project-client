import {
  Button,
  Dialog,
  TextArea,
  TextInput,
  useToast,
} from '@aics/design-system';
import { useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';

import { getTopicErrorMessage } from './getTopicErrorMessage';
import { useSubmitTopicCandidateMutation } from './queries';
import * as styles from './TopicCandidateDialog.css';
import { useTopicCandidateDialog } from './TopicCandidateDialogContext';

export default function TopicCandidateDialog() {
  const toast = useToast();
  const { isOpen, setIsOpen } = useTopicCandidateDialog();
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const candidateMutation = useSubmitTopicCandidateMutation(sectionId);

  const closeDialog = () => {
    setTitle('');
    setDescription('');
    if (!candidateMutation.isPending) candidateMutation.reset();
    setIsOpen(false);
  };

  return (
    <Dialog
      aria-label='주제 후보 추가'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (nextIsOpen) setIsOpen(true);
        else closeDialog();
      }}
      purpose='form'
    >
      <form
        className={styles.form}
        onSubmit={event => {
          event.preventDefault();
          if (!sectionId || !title.trim() || !description.trim()) return;
          candidateMutation.mutate(
            { title, description },
            {
              onSuccess: () => {
                toast({ body: '주제 후보를 추가했어요.' });
                closeDialog();
              },
            },
          );
        }}
      >
        <p className={styles.formTitle}>새 후보 추가</p>
        <TextInput
          label='후보 제목'
          onChange={value => {
            setTitle(value);
            if (candidateMutation.isError) candidateMutation.reset();
          }}
          placeholder='예: 영화관 관리 프로그램'
          value={title}
          width='100%'
        />
        <TextArea
          label='후보 설명'
          onChange={value => {
            setDescription(value);
            if (candidateMutation.isError) candidateMutation.reset();
          }}
          placeholder='해결하려는 문제와 주요 기능을 적어 주세요.'
          value={description}
        />
        {candidateMutation.isError ? (
          <p className={styles.error} role='alert'>
            {getTopicErrorMessage(candidateMutation.error)}
          </p>
        ) : null}
        <div className={styles.formActions}>
          <Button label='닫기' onClick={closeDialog} variant='secondary' />
          <Button
            isDisabled={
              !sectionId ||
              !title.trim() ||
              !description.trim() ||
              candidateMutation.isPending
            }
            isLoading={candidateMutation.isPending}
            label='후보 추가'
            type='submit'
            variant='primary'
          />
        </div>
      </form>
    </Dialog>
  );
}
