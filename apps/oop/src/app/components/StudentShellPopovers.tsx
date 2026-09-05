import type { CurrentUser } from '@aics/core';
import {
  Avatar,
  Button,
  Dialog,
  Heading,
  HStack,
  IconButton,
  Popover,
  Text,
  TextInput,
  useToast,
} from '@aics/design-system';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Menu, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import {
  useLogoutMutation,
  useUpdateMyPasswordMutation,
} from '~/features/auth/queries';

import { oopCourseConfig } from '~/course/config';

import * as styles from './StudentShellPopovers.css';

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

type PasswordValidationIssue = {
  field: PasswordField;
  message: string;
} | null;

export function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordValidationIssue {
  if (!currentPassword) {
    return {
      field: 'currentPassword',
      message: '현재 비밀번호를 입력해 주세요.',
    };
  }

  if (!newPassword) {
    return {
      field: 'newPassword',
      message: '새 비밀번호를 입력해 주세요.',
    };
  }

  if (newPassword.length < 8) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 8자 이상이어야 합니다.',
    };
  }

  if (newPassword === currentPassword) {
    return {
      field: 'newPassword',
      message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    };
  }

  if (!confirmPassword) {
    return {
      field: 'confirmPassword',
      message: '새 비밀번호를 한 번 더 입력해 주세요.',
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      field: 'confirmPassword',
      message: '새 비밀번호가 일치하지 않습니다.',
    };
  }

  return null;
}

function PasswordChangeDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const passwordMutation = useUpdateMyPasswordMutation();
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
    passwordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          toast({ body: '비밀번호를 변경했어요.' });
          close();
        },
      },
    );
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
        if (!nextIsOpen) close();
      }}
      purpose='form'
      width={440}
    >
      <form className={styles.passwordForm} onSubmit={handleSubmit}>
        <Heading className={styles.passwordTitle} level={2}>
          비밀번호 변경
        </Heading>
        <Text className={styles.passwordDescription} color='secondary'>
          현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요. 새 비밀번호는
          8자 이상이어야 합니다.
        </Text>
        <TextInput
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
            비밀번호를 변경하지 못했어요. 현재 비밀번호를 확인해 주세요.
          </Text>
        ) : null}
        <HStack className={styles.passwordActions} gap={2} justify='end'>
          <Button label='취소' onClick={close} variant='secondary' />
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

function StudentProfilePopover({
  currentUser,
  isOpen,
  onOpenChange,
}: {
  currentUser: CurrentUser;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const navigate = useNavigate();
  const logoutMutation = useLogoutMutation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const section = currentUser.sections[0];
  const team = currentUser.currentTeam;

  const openPasswordDialog = () => {
    onOpenChange(false);
    setIsPasswordDialogOpen(true);
  };

  const handleLogout = () => {
    if (logoutMutation.isPending) return;

    logoutMutation.mutate(undefined, {
      onSettled: () => {
        onOpenChange(false);
        void navigate({ to: ROUTES.LOGIN });
      },
    });
  };

  const content = (
    <section
      aria-labelledby='student-shell-profile-popover-title'
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
            id='student-shell-profile-popover-title'
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
          <dt>분반</dt>
          <dd>{section?.code ?? section?.name ?? '미배정'}</dd>
        </div>
        <div className={styles.profileDetailRow}>
          <dt>이메일</dt>
          <dd>{currentUser.email}</dd>
        </div>
        <div className={styles.profileDetailRow}>
          <dt>팀</dt>
          <dd>{team?.name ?? '미배정'}</dd>
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
          label='로그아웃'
          onClick={handleLogout}
          variant='ghost'
          width='100%'
        />
      </div>
    </section>
  );

  return (
    <>
      <Popover
        alignment='end'
        content={content}
        data-testid='student-profile-popover'
        isOpen={isOpen}
        label='내 프로필'
        onOpenChange={onOpenChange}
        placement='below'
        width='min(340px, calc(100vw - 32px))'
      >
        {triggerProps => (
          <IconButton
            {...triggerProps}
            className={styles.profileTrigger}
            icon={
              <Avatar
                alt={currentUser.name}
                name={currentUser.name}
                size={24}
                tooltip={false}
              />
            }
            label='내 프로필 열기'
            size='sm'
            variant='ghost'
          />
        )}
      </Popover>
      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </>
  );
}

const studentNavigationItems = [
  { label: '홈', to: ROUTES.STUDENT.HOME },
  { label: '액션 플랜', to: ROUTES.STUDENT.TEAM_ACTION_PLANS },
  { label: '공지사항', to: ROUTES.STUDENT.NOTICES },
  { label: '회의록', to: ROUTES.STUDENT.MEETINGS },
] as const;

function isStudentNavigationActive(pathname: string, itemPath: string) {
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

  if (itemPath === ROUTES.STUDENT.HOME) {
    return normalizedPathname === itemPath;
  }

  return (
    normalizedPathname === itemPath ||
    normalizedPathname.startsWith(`${itemPath}/`)
  );
}

export function StudentHeaderActions({
  currentUser,
}: {
  currentUser: CurrentUser;
}) {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <div className={styles.headerActions}>
      <div
        className={cx(
          styles.headerMenuPanel,
          isMenuOpen && styles.headerMenuPanelOpen,
        )}
      >
        <nav
          aria-label='학생 메뉴'
          className={cx(styles.headerNav, isMenuOpen && styles.headerNavOpen)}
          id='student-header-navigation'
        >
          {studentNavigationItems.map(item => {
            const isActive = isStudentNavigationActive(pathname, item.to);

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                activeOptions={
                  item.to === ROUTES.STUDENT.HOME ? { exact: true } : undefined
                }
                className={isActive ? styles.navLinkActive : styles.navLink}
                key={item.label}
                onClick={() => setIsMenuOpen(false)}
                to={item.to}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className={styles.headerControls}>
        <StudentProfilePopover
          currentUser={currentUser}
          isOpen={isProfileOpen}
          onOpenChange={setIsProfileOpen}
        />
        <IconButton
          aria-controls='student-header-navigation'
          aria-expanded={isMenuOpen}
          className={styles.menuToggle}
          icon={
            isMenuOpen ? <X aria-hidden='true' /> : <Menu aria-hidden='true' />
          }
          label={isMenuOpen ? '학생 메뉴 닫기' : '학생 메뉴 열기'}
          onClick={() => setIsMenuOpen(open => !open)}
          size='sm'
          variant='ghost'
        />
      </div>
    </div>
  );
}
