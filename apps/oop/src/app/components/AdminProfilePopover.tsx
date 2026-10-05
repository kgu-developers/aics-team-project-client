import type { CurrentUser } from '@aics/core';
import {
  Avatar,
  Button,
  Dialog,
  Heading,
  HStack,
  Popover,
  Text,
  TextInput,
  useToast,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { type FormEvent, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { getPasswordChangeErrorMessage } from '~/features/auth/getPasswordChangeErrorMessage';
import {
  useLogoutMutation,
  useUpdateMyPasswordMutation,
} from '~/features/auth/queries';
import {
  validatePasswordChange,
  type PasswordValidationIssue,
} from '~/features/auth/validatePasswordChange';

import { oopCourseConfig } from '~/course/config';

import * as styles from './AdminProfilePopover.css';

function PasswordChangeDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const passwordMutation = useUpdateMyPasswordMutation({
    onSuccess: () => {
      toast({ body: '비밀번호를 변경했어요. 다시 로그인해 주세요.' });
      close();
      void navigate({ to: ROUTES.LOGIN, replace: true });
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
        <TextInput
          isDisabled={passwordMutation.isPending}
          htmlName='currentPassword'
          isRequired
          label='현재 비밀번호'
          onChange={value => handleFieldChange(setCurrentPassword, value)}
          status={
            validationIssue?.field === 'currentPassword'
              ? { message: validationIssue.message, type: 'error' }
              : undefined
          }
          type='password'
          value={currentPassword}
          width='100%'
        />
        <TextInput
          isDisabled={passwordMutation.isPending}
          htmlName='newPassword'
          isRequired
          label='새 비밀번호'
          onChange={value => handleFieldChange(setNewPassword, value)}
          status={
            validationIssue?.field === 'newPassword'
              ? { message: validationIssue.message, type: 'error' }
              : undefined
          }
          type='password'
          value={newPassword}
          width='100%'
        />
        <TextInput
          isDisabled={passwordMutation.isPending}
          htmlName='confirmPassword'
          isRequired
          label='새 비밀번호 확인'
          onChange={value => handleFieldChange(setConfirmPassword, value)}
          status={
            validationIssue?.field === 'confirmPassword'
              ? { message: validationIssue.message, type: 'error' }
              : undefined
          }
          type='password'
          value={confirmPassword}
          width='100%'
        />
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

function resolveAdminRoleLabel(role: CurrentUser['globalRole']) {
  return role === 'PROFESSOR' ? '담당 교수' : '조교';
}

function resolveSectionLabel(sections: CurrentUser['sections']) {
  if (sections.length === 0) return '담당 분반 없음';

  return sections.map(section => section.code || section.name).join(', ');
}

export default function AdminProfilePopover({
  currentUser,
}: {
  currentUser: CurrentUser;
}) {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const openPasswordDialog = () => {
    setIsOpen(false);
    setIsPasswordDialogOpen(true);
  };

  const handleLogout = () => {
    if (logoutMutation.isPending) return;

    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
        void navigate({ to: ROUTES.LOGIN });
      },
    });
  };

  const content = (
    <section
      aria-labelledby='admin-profile-popover-title'
      className={styles.profilePopover}
    >
      <div className={styles.profileIdentity}>
        <Avatar
          alt={currentUser.name}
          name={currentUser.name}
          size={48}
          tooltip={false}
        />
        <div className={styles.profileIdentityCopy}>
          <Heading
            className={styles.profileName}
            id='admin-profile-popover-title'
            level={2}
          >
            {currentUser.name}
          </Heading>
          <Text color='secondary' type='supporting'>
            {currentUser.studentNumber}
          </Text>
        </div>
      </div>

      <dl className={styles.profileDetails}>
        <div className={styles.profileDetailRow}>
          <dt>강의</dt>
          <dd>{oopCourseConfig.title}</dd>
        </div>
        <div className={styles.profileDetailRow}>
          <dt>역할</dt>
          <dd>{resolveAdminRoleLabel(currentUser.globalRole)}</dd>
        </div>
        <div className={styles.profileDetailRow}>
          <dt>담당 분반</dt>
          <dd>{resolveSectionLabel(currentUser.sections)}</dd>
        </div>
        <div className={styles.profileDetailRow}>
          <dt>이메일</dt>
          <dd>{currentUser.email}</dd>
        </div>
      </dl>

      <div className={styles.profileActions}>
        <Button
          label='비밀번호 변경'
          onClick={openPasswordDialog}
          variant='secondary'
          width='100%'
        />
        <Button
          isDisabled={logoutMutation.isPending}
          isLoading={logoutMutation.isPending}
          label={logoutMutation.isError ? '로그아웃 다시 시도' : '로그아웃'}
          onClick={handleLogout}
          variant='ghost'
          width='100%'
        />
      </div>
      {logoutMutation.isError ? (
        <Text className={styles.logoutError} role='alert'>
          로그아웃하지 못했습니다. 로그인 상태가 유지됩니다. 다시 시도해 주세요.
        </Text>
      ) : null}
    </section>
  );

  return (
    <>
      <Popover
        alignment='end'
        content={content}
        isOpen={isOpen}
        label='내 프로필'
        onOpenChange={setIsOpen}
        placement='above'
        width='min(340px, calc(100dvw - 48px))'
      >
        {triggerProps => (
          <Button
            {...triggerProps}
            className={styles.profileTrigger}
            label='내 프로필 열기'
            type='button'
            variant='ghost'
            width='100%'
          >
            <span className={styles.profileTriggerCopy}>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.studentNumber} · 프로필</span>
            </span>
          </Button>
        )}
      </Popover>
      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </>
  );
}
