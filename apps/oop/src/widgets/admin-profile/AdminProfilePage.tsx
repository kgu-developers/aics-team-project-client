import {
  Button,
  Card,
  Dialog,
  Heading,
  HStack,
  Text,
  TextInput,
  useToast,
  VStack,
} from '@aics/design-system';
import { type FormEvent, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { getPasswordChangeErrorMessage } from '~/features/auth/getPasswordChangeErrorMessage';
import {
  useLogoutMutation,
  useUpdateMyPasswordMutation,
} from '~/features/auth/queries';
import {
  validatePasswordChange,
  type PasswordValidationIssue,
} from '~/features/auth/validatePasswordChange';

import * as styles from './AdminProfilePage.css';

function PasswordChangeDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const passwordMutation = useUpdateMyPasswordMutation({
    onSuccess: () => {
      toast({ body: '비밀번호를 변경했어요. 다시 로그인해 주세요.' });
      close();
    },
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationIssue, setValidationIssue] =
    useState<PasswordValidationIssue>(null);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setValidationIssue(null);
    passwordMutation.reset();
  };

  const close = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordMutation.isPending) return;
    const issue = validatePasswordChange(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (issue) {
      setValidationIssue(issue);
      return;
    }
    setValidationIssue(null);
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  const handleFieldChange = (
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);
    if (validationIssue) setValidationIssue(null);
    if (passwordMutation.isError) passwordMutation.reset();
  };

  return (
    <Dialog
      aria-label='비밀번호 변경'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen && !passwordMutation.isPending) close();
      }}
      purpose='info'
      width={440}
    >
      <form className={styles.passwordForm} onSubmit={handleSubmit}>
        <Heading className={styles.passwordTitle} level={2}>
          비밀번호 변경
        </Heading>
        <Text className={styles.passwordDescription} color='secondary'>
          현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요. 새 비밀번호는
          8자 이상 입력해 주세요.
        </Text>
        {(
          [
            [
              'currentPassword',
              '현재 비밀번호',
              currentPassword,
              setCurrentPassword,
            ],
            ['newPassword', '새 비밀번호', newPassword, setNewPassword],
            [
              'confirmPassword',
              '새 비밀번호 확인',
              confirmPassword,
              setConfirmPassword,
            ],
          ] as const
        ).map(([field, label, value, setter]) => (
          <TextInput
            isDisabled={passwordMutation.isPending}
            htmlName={field}
            isRequired
            key={field}
            label={label}
            onChange={nextValue => handleFieldChange(setter, nextValue)}
            status={
              validationIssue?.field === field
                ? { message: validationIssue.message, type: 'error' }
                : undefined
            }
            type='password'
            value={value}
            width='100%'
          />
        ))}
        {passwordMutation.isError ? (
          <Text className={styles.passwordError} role='alert'>
            {getPasswordChangeErrorMessage(passwordMutation.error)}
          </Text>
        ) : null}
        <HStack className={styles.passwordActions} gap={2} justify='end'>
          <Button
            isDisabled={passwordMutation.isPending}
            label='취소'
            onClick={close}
            variant='secondary'
          />
          <Button
            isDisabled={passwordMutation.isPending}
            isLoading={passwordMutation.isPending}
            label='비밀번호 변경'
            type='submit'
            variant='primary'
          />
        </HStack>
      </form>
    </Dialog>
  );
}

export default function AdminProfilePage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const logoutMutation = useLogoutMutation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  return (
    <div className={styles.page}>
      <HStack className={styles.pageHeader} justify='between'>
        <Heading level={1}>마이페이지</Heading>
        <HStack className={styles.pageHeaderActions} gap={2}>
          <Button
            label='비밀번호 변경'
            onClick={() => setIsPasswordDialogOpen(true)}
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={logoutMutation.isPending}
            isLoading={logoutMutation.isPending}
            label={logoutMutation.isError ? '로그아웃 다시 시도' : '로그아웃'}
            onClick={() => logoutMutation.mutate()}
            type='button'
            variant='ghost'
          />
        </HStack>
      </HStack>
      {logoutMutation.isError ? (
        <Text role='alert'>
          로그아웃하지 못했습니다. 로그인 상태가 유지됩니다. 다시 시도해 주세요.
        </Text>
      ) : null}

      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />

      <Card className={styles.profileCard} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>프로필 정보</Heading>
            <Text color='secondary' type='supporting'>
              로그인한 계정의 이름과 이메일입니다.
            </Text>
          </header>

          <div className={styles.profileForm}>
            <TextInput
              label='이름'
              isDisabled
              value={currentUser?.name ?? ''}
              width='100%'
            />
            <TextInput
              label='이메일'
              isDisabled
              type='email'
              value={currentUser?.email ?? ''}
              width='100%'
            />
          </div>
        </VStack>
      </Card>
    </div>
  );
}
