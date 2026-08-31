import {
  Button,
  Card,
  Dialog,
  FileInput,
  Heading,
  HStack,
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
import {
  useLogoutMutation,
  useUpdateMyPasswordMutation,
} from '~/features/auth/queries';

import * as styles from './AdminProfilePage.css';

type UploadFileKind = 'studentRoster' | 'teamRoster';
type Section = { id: string; code: string; name: string };
type UploadedFile = { name: string; uploadedAt: string };

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
  uploadedFile,
  isOpen,
  kind,
  onClose,
  onFileChange,
  onUpload,
  onSectionChange,
  sections,
  sectionId,
}: {
  file: File | null;
  uploadedFile: UploadedFile | null;
  isOpen: boolean;
  kind: UploadFileKind | null;
  onClose: () => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
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
          업로드할 분반을 선택한 뒤 Excel 파일을 선택해 주세요. 아직 서버에
          업로드되지는 않습니다.
        </Text>
        <label>
          <Text>분반</Text>
          <select
            aria-label='업로드 분반'
            className={styles.sectionSelect}
            onChange={event => onSectionChange(event.target.value)}
            value={sectionId}
          >
            {sections.map(section => (
              <option key={section.id} value={section.id}>
                {section.code} ({section.name})
              </option>
            ))}
          </select>
        </label>
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
            {file.name} 선택됨 · 아직 업로드되지 않았습니다.
          </Text>
        ) : null}
        {uploadedFile ? (
          <Text color='secondary' type='supporting'>
            현재 업로드 파일: {uploadedFile.name}
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
          <Button
            isDisabled={!file}
            label={uploadedFile ? '파일 교체' : '업로드'}
            onClick={onUpload}
            variant='primary'
          />
          <Button label='닫기' onClick={onClose} variant='secondary' />
        </div>
      </VStack>
    </Dialog>
  );
}

type PasswordValidationIssue = {
  field: 'currentPassword' | 'newPassword' | 'confirmPassword';
  message: string;
} | null;

function validatePasswordChange(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): PasswordValidationIssue {
  if (!currentPassword)
    return {
      field: 'currentPassword',
      message: '현재 비밀번호를 입력해 주세요.',
    };
  if (!newPassword)
    return { field: 'newPassword', message: '새 비밀번호를 입력해 주세요.' };
  if (newPassword.length < 8)
    return {
      field: 'newPassword',
      message: '새 비밀번호는 8자 이상이어야 합니다.',
    };
  if (newPassword === currentPassword)
    return {
      field: 'newPassword',
      message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    };
  if (!confirmPassword)
    return {
      field: 'confirmPassword',
      message: '새 비밀번호를 한 번 더 입력해 주세요.',
    };
  if (newPassword !== confirmPassword)
    return {
      field: 'confirmPassword',
      message: '새 비밀번호가 일치하지 않습니다.',
    };
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

export default function AdminProfilePage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const toast = useToast();
  const logoutMutation = useLogoutMutation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const [uploadFiles, setUploadFiles] = useState<
    Record<UploadFileKind, Record<string, File | null>>
  >({
    studentRoster: {},
    teamRoster: {},
  });
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<UploadFileKind, Record<string, UploadedFile>>
  >({
    studentRoster: {},
    teamRoster: {},
  });
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
  const selectedUploadFile =
    uploadKind && uploadSectionId
      ? (uploadFiles[uploadKind][uploadSectionId] ?? null)
      : null;
  const selectedUploadedFile =
    uploadKind && uploadSectionId
      ? (uploadedFiles[uploadKind][uploadSectionId] ?? null)
      : null;

  function openUploadDialog(kind: UploadFileKind) {
    if (!hasUploadSections) return;

    setUploadKind(kind);
    setUploadSectionId(uploadSections[0]?.id ?? '');
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

  function handleUpload() {
    if (!uploadKind || !uploadSectionId) return;
    const file = uploadFiles[uploadKind][uploadSectionId];
    if (!file) return;
    setUploadedFiles(current => ({
      ...current,
      [uploadKind]: {
        ...current[uploadKind],
        [uploadSectionId]: {
          name: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    }));
    setUploadKind(null);
    setUploadSectionId('');
  }

  function handleDeleteUpload(kind: UploadFileKind, sectionId: string) {
    setUploadedFiles(current => {
      const next = { ...current[kind] };
      delete next[sectionId];
      return { ...current, [kind]: next };
    });
  }

  return (
    <div className={styles.page}>
      <HStack justify='between'>
        <Heading level={1}>마이페이지</Heading>
        <HStack gap={2}>
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
                          <span className={styles.sectionFile}>
                            {uploadedFiles[kind][section.id]
                              ? `업로드 완료 · ${uploadedFiles[kind][section.id]?.name ?? ''}`
                              : '파일 없음'}
                          </span>
                          {uploadedFiles[kind][section.id] ? (
                            <HStack className={styles.statusActions} gap={1}>
                              <Button
                                label='수정'
                                onClick={() => {
                                  setUploadKind(kind);
                                  setUploadSectionId(section.id);
                                  setUploadFiles(current => ({
                                    ...current,
                                    [kind]: {
                                      ...current[kind],
                                      [section.id]: null,
                                    },
                                  }));
                                }}
                                type='button'
                                variant='secondary'
                              />
                              <Button
                                label='삭제'
                                onClick={() =>
                                  handleDeleteUpload(kind, section.id)
                                }
                                type='button'
                                variant='ghost'
                              />
                            </HStack>
                          ) : null}
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
        file={selectedUploadFile}
        onUpload={handleUpload}
        uploadedFile={selectedUploadedFile}
        isOpen={uploadKind !== null && uploadSectionId !== ''}
        kind={uploadKind}
        onClose={() => setUploadKind(null)}
        onFileChange={file => {
          if (!uploadKind || !uploadSectionId) return;
          setUploadFiles(current => ({
            ...current,
            [uploadKind]: {
              ...current[uploadKind],
              [uploadSectionId]: file,
            },
          }));
        }}
        onSectionChange={setUploadSectionId}
        sections={uploadSections}
        sectionId={uploadSectionId}
      />
    </div>
  );
}
