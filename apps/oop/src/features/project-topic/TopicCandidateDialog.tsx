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
import { isUncertainTopicWrite } from './liveTopicBoard';
import { useSubmitTopicCandidateMutation } from './queries';
import { useTopicApi } from './TopicApiContext';
import * as styles from './TopicCandidateDialog.css';
import { useTopicCandidateDialog } from './TopicCandidateDialogContext';

export default function TopicCandidateDialog() {
  const live = useTopicApi();
  const toast = useToast();
  const { isOpen, setIsOpen } = useTopicCandidateDialog();
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const legacyMutation = useSubmitTopicCandidateMutation(sectionId);
  const candidateMutation = live?.mutation ?? legacyMutation;

  const closeDialog = () => {
    if (candidateMutation.isPending) return;
    setTitle('');
    setDescription('');
    if (!isUncertainTopicWrite(candidateMutation.error))
      candidateMutation.reset();
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
          if (
            (live ? !live.ready : !sectionId) ||
            !title.trim() ||
            title.trim().length > 200 ||
            !description.trim()
          )
            return;
          if (live) {
            void live
              .submit({ title, description })
              .then(saved => {
                if (saved) {
                  toast({ body: '주제 후보를 추가했어요.' });
                  closeDialog();
                }
              })
              .catch(() => {});
            return;
          }
          legacyMutation.mutate(
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
            if (!live && candidateMutation.isError) candidateMutation.reset();
          }}
          placeholder='예: 영화관 관리 프로그램'
          value={title}
          width='100%'
        />
        <TextArea
          label='후보 설명'
          onChange={value => {
            setDescription(value);
            if (!live && candidateMutation.isError) candidateMutation.reset();
          }}
          placeholder='해결하려는 문제와 주요 기능을 적어 주세요.'
          value={description}
        />
        {candidateMutation.isError ? (
          <p className={styles.error} role='alert'>
            {live && isUncertainTopicWrite(candidateMutation.error)
              ? '등록 결과를 확인하지 못했어요. 결과 확인을 눌러 최신 목록을 확인해 주세요.'
              : getTopicErrorMessage(candidateMutation.error)}
          </p>
        ) : null}
        <div className={styles.formActions}>
          <Button label='닫기' onClick={closeDialog} variant='secondary' />
          <Button
            isDisabled={
              (live ? !live.canParticipate || live.busy : !sectionId) ||
              title.trim().length > 200 ||
              !title.trim() ||
              !description.trim() ||
              candidateMutation.isPending
            }
            isLoading={candidateMutation.isPending}
            label={
              live && isUncertainTopicWrite(candidateMutation.error)
                ? '결과 확인'
                : '후보 추가'
            }
            type='submit'
            variant='primary'
          />
        </div>
      </form>
    </Dialog>
  );
}
