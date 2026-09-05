import {
  Button,
  Card,
  Dialog,
  FileInput,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
  useToast,
  VStack,
} from '@aics/design-system';
import { type FormEvent, useEffect, useState } from 'react';

import {
  useAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from '~/features/admin-profile/queries';
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

type UploadFileKind = 'studentRoster' | 'teamRoster';
type Section = { id: string; code: string; name: string };

const uploadCopy: Record<
  UploadFileKind,
  { description: string; label: string; title: string }
> = {
  studentRoster: {
    description:
      '학번, 이름, 소속(전공), 학년, 학적 구분, 이메일 컬럼 포함 Excel (.xls/.xlsx)',
    label: '학생 명단 파일 선택',
    title: '학생 명단',
  },
  teamRoster: {
    description: '팀명, 학번 컬럼 포함 Excel (.xls/.xlsx)',
    label: '팀 구성 명단 파일 선택',
    title: '팀 구성 명단',
  },
};

function FileSelectionCard({
  isDisabled,
  kind,
  onOpen,
}: {
  isDisabled: boolean;
  kind: UploadFileKind;
  onOpen: () => void;
}) {
  const copy = uploadCopy[kind];

  return (
    <Card className={styles.uploadCard} padding={3} variant='muted'>
      <VStack gap={2}>
        <Heading level={3}>{copy.title}</Heading>
        <Text color='secondary' type='supporting'>
          {copy.description}
        </Text>
        <Button
          isDisabled={isDisabled}
          label={copy.label}
          onClick={onOpen}
          variant='primary'
        />
      </VStack>
    </Card>
  );
}

function UploadDialog({
  file,
  isOpen,
  kind,
  onClose,
  onFileChange,
  onSectionChange,
  sections,
  sectionId,
}: {
  file: File | null;
  isOpen: boolean;
  kind: UploadFileKind | null;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onSectionChange: (sectionId: string) => void;
  sections: Section[];
  sectionId: string;
}) {
  if (!kind) return null;
  const copy = uploadCopy[kind];

  return (
    <Dialog
      aria-label={`${copy.title} 업로드`}
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={520}
    >
      <VStack gap={3}>
        <Heading level={2}>{copy.title} 업로드</Heading>
        <Text color='secondary' type='supporting'>
          업로드할 분반을 선택한 뒤 Excel 파일을 선택해 주세요. 파일은 서버
          업로드 API가 준비되기 전까지 임시로만 선택됩니다.
        </Text>
        <Selector
          label='분반'
          onChange={onSectionChange}
          options={sections.map(section => ({
            label: `${section.code} (${section.name})`,
            value: section.id,
          }))}
          renderOption={option => (
            <SelectorOption label={option.label ?? option.value} />
          )}
          value={sectionId}
          width='100%'
        />
        <FileInput
          accept='.xls,.xlsx'
          label={copy.label}
          mode='input'
          onChange={selected => {
            const nextFile = Array.isArray(selected) ? selected[0] : selected;
            onFileChange(nextFile ?? null);
          }}
          placeholder='Excel 파일 선택'
          value={file}
          width='100%'
        />
        {file ? (
          <Text color='secondary' role='status' type='supporting'>
            {file.name} 선택됨 · 서버 업로드 전
          </Text>
        ) : null}
        <div className={styles.actions}>
          {file ? (
            <Button
              label='선택한 파일 제거'
              onClick={() => onFileChange(null)}
              variant='secondary'
            />
          ) : null}
          <Button label='닫기' onClick={onClose} variant='secondary' />
        </div>
      </VStack>
    </Dialog>
  );
}

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
      purpose='form'
      width={440}
    >
      <form className={styles.passwordForm} onSubmit={handleSubmit}>
        <Heading className={styles.passwordTitle} level={2}>
          비밀번호 변경
        </Heading>
        <Text className={styles.passwordDescription} color='secondary'>
          현재 비밀번호를 확인한 뒤 새 비밀번호를 설정해 주세요. 새 비밀번호는
          8~64자, UTF-8 기준 72바이트 이하여야 합니다.
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
  const toast = useToast();
  const logoutMutation = useLogoutMutation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const sections = currentUser?.sections ?? [];
  const hasUploadSections = sections.length > 0;
  const profileQuery = useAdminProfileQuery();
  const updateProfileMutation = useUpdateAdminProfileMutation();
  const [savedIntroduction, setSavedIntroduction] = useState('');
  useEffect(() => {
    if (!updateProfileMutation.isSuccess) {
      setSavedIntroduction(profileQuery.data?.introduction ?? '');
    }
  }, [profileQuery.data?.introduction, updateProfileMutation.isSuccess]);
  const hasSavedIntroduction = savedIntroduction.trim().length > 0;
  const showIntroductionEditor = isEditingIntroduction || !hasSavedIntroduction;
  const uploadSections = sections.map(section => ({
    code: section.code,
    id: section.id,
    name: section.name,
  }));
  function openUploadDialog(kind: UploadFileKind) {
    if (!hasUploadSections) return;

    setUploadKind(kind);
    setUploadSectionId(uploadSections[0]?.id ?? '');
    setUploadFile(null);
  }

  function closeUploadDialog() {
    setUploadFile(null);
    setUploadKind(null);
    setUploadSectionId('');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateProfileMutation.mutate(
      { introduction: message },
      {
        onSuccess: profile => {
          setMessage(profile.introduction);
          setSavedIntroduction(profile.introduction);
          setIsEditingIntroduction(false);
          toast({ body: '소개 메시지를 저장했어요.' });
        },
      },
    );
  }

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
            label='로그아웃'
            onClick={() => logoutMutation.mutate()}
            type='button'
            variant='ghost'
          />
        </HStack>
      </HStack>

      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />

      <Card className={styles.profileCard} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>프로필 정보</Heading>
            <Text color='secondary' type='supporting'>
              학생 화면에서 교수 상세보기로 노출될 정보입니다. 이름, 이메일,
              간단한 메시지를 입력해 주세요.
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
            {showIntroductionEditor ? (
              <form className={styles.introductionForm} onSubmit={handleSubmit}>
                <TextArea
                  isDisabled={profileQuery.isPending}
                  label='간단한 메시지'
                  onChange={setMessage}
                  placeholder='예) 안녕하세요. OOP 팀프로젝트를 담당하는 교수자입니다. 궁금한 점은 쪽지로 남겨주세요.'
                  value={message}
                  width='100%'
                />
                <Text color='secondary' type='supporting'>
                  학생들에게 노출되는 소개 메시지입니다.
                </Text>
                <div className={styles.actions}>
                  <Button
                    isDisabled={
                      profileQuery.isLoading || updateProfileMutation.isPending
                    }
                    label='저장하기'
                    type='submit'
                    variant='primary'
                  />
                </div>
              </form>
            ) : (
              <section className={styles.introductionForm}>
                <Text className={styles.fieldLabel}>간단한 메시지</Text>
                <div
                  aria-label='간단한 메시지'
                  className={styles.introductionPreview}
                >
                  {savedIntroduction}
                </div>
                <Text color='secondary' type='supporting'>
                  학생들에게 노출되는 소개 메시지입니다.
                </Text>
                <div className={styles.actions}>
                  <Button
                    label='수정하기'
                    onClick={() => {
                      updateProfileMutation.reset();
                      setMessage(savedIntroduction);
                      setIsEditingIntroduction(true);
                    }}
                    type='button'
                    variant='secondary'
                  />
                </div>
              </section>
            )}
            {profileQuery.isError ? (
              <Text role='alert'>
                소개 메시지를 불러오지 못했습니다. 저장하면 다시 시도합니다.
              </Text>
            ) : null}
            {updateProfileMutation.isError ? (
              <Text role='alert'>
                소개 메시지를 저장하지 못했습니다. 다시 시도해 주세요.
              </Text>
            ) : null}
          </div>
        </VStack>
      </Card>

      <Card className={styles.uploadSection} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>데이터 업로드</Heading>
            <Text color='secondary' type='supporting'>
              학생 명단과 팀 구성 명단은 분반별 Excel 파일로 관리합니다.
            </Text>
          </header>

          <div className={styles.uploadGrid}>
            <FileSelectionCard
              isDisabled={!hasUploadSections}
              kind='studentRoster'
              onOpen={() => openUploadDialog('studentRoster')}
            />
            <FileSelectionCard
              isDisabled={!hasUploadSections}
              kind='teamRoster'
              onOpen={() => openUploadDialog('teamRoster')}
            />
          </div>

          <section aria-labelledby='section-upload-status'>
            <Heading id='section-upload-status' level={3}>
              분반별 업로드 현황
            </Heading>
            {sections.length === 0 ? (
              <Text color='secondary' role='status'>
                담당 분반이 없어 명단 파일을 선택할 수 없습니다.
              </Text>
            ) : (
              <div className={styles.statusGroups}>
                {(['studentRoster', 'teamRoster'] as const).map(kind => (
                  <section key={kind}>
                    <Heading level={4}>{uploadCopy[kind].title}</Heading>
                    <ul className={styles.sectionStatusList}>
                      {sections.map(section => (
                        <li key={section.id}>
                          <strong className={styles.sectionCode}>
                            {section.code}
                          </strong>
                          <span className={styles.sectionFile}>파일 없음</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </section>
        </VStack>
      </Card>

      <UploadDialog
        file={uploadFile}
        isOpen={uploadKind !== null && uploadSectionId !== ''}
        kind={uploadKind}
        onClose={closeUploadDialog}
        onFileChange={setUploadFile}
        onSectionChange={sectionId => {
          setUploadSectionId(sectionId);
          setUploadFile(null);
        }}
        sections={uploadSections}
        sectionId={uploadSectionId}
      />
    </div>
  );
}
