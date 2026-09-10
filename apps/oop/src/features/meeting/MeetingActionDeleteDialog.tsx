import type { MeetingAction } from '@aics/core';
import { Button, Dialog, Heading, Text, useToast } from '@aics/design-system';
import { isAxiosError } from 'axios';

import * as styles from './MeetingActionDeleteDialog.css';
import { useRemoveMeetingActionMutation } from './queries';

export default function MeetingActionDeleteDialog({
  action,
  teamId,
  onClose,
}: {
  action: MeetingAction;
  teamId: string;
  onClose: () => void;
}) {
  const mutation = useRemoveMeetingActionMutation();
  const toast = useToast();
  const error = mutation.error;
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return (
    <Dialog
      aria-label='액션 플랜 삭제'
      isOpen
      onOpenChange={open => {
        if (!open && !mutation.isPending) onClose();
      }}
      purpose='form'
      width={440}
    >
      <div className={styles.body}>
        <Heading level={2}>액션 플랜을 삭제할까요?</Heading>
        <Text>{action.content}</Text>
        <Text color='secondary'>삭제한 액션 플랜은 복구할 수 없어요.</Text>
        {error ? (
          <p role='alert'>
            {status === 404
              ? '이미 삭제된 액션 플랜이에요. 창을 닫고 목록을 확인해 주세요.'
              : status === 403
                ? '이 액션 플랜을 삭제할 권한이 없어요.'
                : status === 401
                  ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
                  : '삭제 결과를 확인하지 못했어요. 목록을 확인한 뒤 다시 시도해 주세요.'}
          </p>
        ) : null}
        <div className={styles.actions}>
          <Button
            label='취소'
            variant='secondary'
            isDisabled={mutation.isPending}
            onClick={onClose}
          />
          <Button
            label='삭제'
            isDisabled={mutation.isPending || status === 404}
            isLoading={mutation.isPending}
            onClick={() =>
              mutation.mutate(
                { actionId: action.id, meetingId: action.meetingId, teamId },
                {
                  onSuccess: () => {
                    toast({ body: '액션 플랜을 삭제했어요.' });
                    onClose();
                  },
                },
              )
            }
          />
        </div>
      </div>
    </Dialog>
  );
}
