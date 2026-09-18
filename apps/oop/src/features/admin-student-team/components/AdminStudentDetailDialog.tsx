import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  useToast,
} from '@aics/design-system';
import { type ReactNode, useState } from 'react';

import {
  useAdminUserQuery,
  useResetAdminUserPasswordMutation,
} from '../queries';
import * as styles from './AdminStudentDetailDialog.css';

type AdminStudentDetailDialogProps = {
  allowPasswordReset?: boolean;
  studentNumber: string | null;
  major?: string | null;
  details?: ReactNode;
  onClose: () => void;
};

export default function AdminStudentDetailDialog({
  allowPasswordReset = false,
  studentNumber,
  major,
  details,
  onClose,
}: AdminStudentDetailDialogProps) {
  const toast = useToast();
  const userQuery = useAdminUserQuery(studentNumber);
  const resetPasswordMutation = useResetAdminUserPasswordMutation();
  const [isResetConfirmationOpen, setIsResetConfirmationOpen] = useState(false);
  const user = userQuery.data;

  const closeResetConfirmation = () => {
    if (resetPasswordMutation.isPending) return;
    setIsResetConfirmationOpen(false);
    resetPasswordMutation.reset();
  };

  const closeDetail = () => {
    if (resetPasswordMutation.isPending) return;
    setIsResetConfirmationOpen(false);
    resetPasswordMutation.reset();
    onClose();
  };

  const confirmPasswordReset = () => {
    if (!user || resetPasswordMutation.isPending) return;

    resetPasswordMutation.mutate(user.studentNumber, {
      onSuccess: () => {
        setIsResetConfirmationOpen(false);
        onClose();
        toast({ body: `${user.name} 학생의 비밀번호를 초기화했습니다.` });
      },
    });
  };

  return (
    <>
      <Dialog
        aria-label={user ? `${user.name} 수강생 정보` : '수강생 정보'}
        isOpen={studentNumber !== null}
        onOpenChange={open => {
          if (!open) closeDetail();
        }}
        purpose='info'
        width={480}
      >
        <div className={styles.content}>
          <Heading level={2}>{user?.name ?? '수강생'} 정보</Heading>
          {userQuery.isPending ? (
            <Text>수강생 정보를 불러오는 중입니다.</Text>
          ) : null}
          {userQuery.isError ? (
            <Text role='alert'>수강생 정보를 불러오지 못했습니다.</Text>
          ) : null}
          {user ? (
            <dl className={styles.detailList}>
              <div>
                <dt>이름</dt>
                <dd>{user.name}</dd>
              </div>
              <div>
                <dt>학번</dt>
                <dd>{user.studentNumber}</dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{user.email}</dd>
              </div>
              <div>
                <dt>전공</dt>
                <dd>{major ?? '전공 정보 없음'}</dd>
              </div>
              <div>
                <dt>전화번호</dt>
                <dd>{user.phone}</dd>
              </div>
            </dl>
          ) : null}
          {details ?? null}
          <HStack gap={2} justify='end'>
            {user && allowPasswordReset ? (
              <Button
                label='비밀번호 초기화'
                onClick={() => {
                  resetPasswordMutation.reset();
                  setIsResetConfirmationOpen(true);
                }}
                variant='destructive'
              />
            ) : null}
            <Button label='닫기' onClick={closeDetail} variant='secondary' />
          </HStack>
        </div>
      </Dialog>
      <Dialog
        aria-describedby='admin-student-password-reset-description'
        aria-label={
          user
            ? `${user.name}(${user.studentNumber}) 비밀번호 초기화 확인`
            : '비밀번호 초기화 확인'
        }
        isOpen={Boolean(user && isResetConfirmationOpen)}
        onOpenChange={open => {
          if (!open) closeResetConfirmation();
        }}
        purpose='info'
        role='alertdialog'
        width={440}
      >
        {user ? (
          <div className={styles.content}>
            <Heading level={2}>비밀번호를 초기화할까요?</Heading>
            <Text id='admin-student-password-reset-description'>
              {user.name}({user.studentNumber}) 학생의 비밀번호는 등록된
              전화번호로 초기화되며, 기존 로그인 세션은 모두 해제됩니다. 학생은
              초기화 후 새 비밀번호로 변경해야 합니다.
            </Text>
            {resetPasswordMutation.isError ? (
              <Text role='alert'>
                비밀번호를 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.
                계속 실패하면 학생의 등록 정보를 확인해 주세요.
              </Text>
            ) : null}
            <HStack gap={2} justify='end'>
              <Button
                data-autofocus='true'
                isDisabled={resetPasswordMutation.isPending}
                label='취소'
                onClick={closeResetConfirmation}
                variant='secondary'
              />
              <Button
                isDisabled={resetPasswordMutation.isPending}
                isLoading={resetPasswordMutation.isPending}
                label='초기화 확인'
                onClick={confirmPasswordReset}
                variant='destructive'
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
