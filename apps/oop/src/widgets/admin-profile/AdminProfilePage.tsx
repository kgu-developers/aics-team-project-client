import type { AdminRosterImportAppliedDto } from '@aics/api-client';
import type { CurrentUserSection, SectionResponse } from '@aics/core';
import {
  Button,
  Card,
  Dialog,
  Heading,
  HStack,
  Text,
  TextArea,
  TextInput,
  useToast,
  VStack,
} from '@aics/design-system';
import { type FormEvent, useEffect, useMemo, useState } from 'react';

import {
  useAdminProfileQuery,
  useUpdateAdminProfileMutation,
} from '~/features/admin-profile/queries';
import AdminCourseManagement from '~/features/admin-course/components/AdminCourseManagement';
import EnrollmentImportDialog from '~/features/admin-student-team/components/EnrollmentImportDialog';
import TeamImportDialog from '~/features/admin-student-team/components/TeamImportDialog';
import { useAdminRosterImportStatusQueries } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { fetchSessionUser } from '~/features/auth/fetchSessionUser';
import { getPasswordChangeErrorMessage } from '~/features/auth/getPasswordChangeErrorMessage';
import {
  useLogoutMutation,
  useUpdateMyPasswordMutation,
} from '~/features/auth/queries';
import {
  validatePasswordChange,
  type PasswordValidationIssue,
} from '~/features/auth/validatePasswordChange';

import { AdminPreSurveyResponses } from './AdminPreSurveyResponses';
import * as styles from './AdminProfilePage.css';
import { formatRosterImportAppliedAt } from './formatRosterImportAppliedAt';

type UploadFileKind = 'studentRoster' | 'teamRoster';
type UploadSection = { code: string; id: string; name: string };
type CourseUploadSection = CurrentUserSection &
  Required<
    Pick<
      SectionResponse,
      'courseId' | 'courseName' | 'semester' | 'status' | 'year'
    >
  >;
type CourseUploadGroup = {
  courseName: string;
  key: string;
  sections: CourseUploadSection[];
  semester: SectionResponse['semester'];
  year: number;
};

function semesterLabel(semester: SectionResponse['semester']) {
  return (
    {
      FALL: '2학기',
      SPRING: '1학기',
      SUMMER: '여름학기',
      WINTER: '겨울학기',
    }[semester] ?? semester
  );
}

function toUploadSection(section: CurrentUserSection): UploadSection {
  return { code: section.code, id: section.id, name: section.name };
}

function hasCourseDetails(
  section: CurrentUserSection,
): section is CourseUploadSection {
  return (
    typeof section.courseId === 'number' &&
    typeof section.courseName === 'string' &&
    typeof section.year === 'number' &&
    section.semester !== undefined &&
    section.status !== undefined
  );
}

function groupSectionsByCourse(
  sections: CurrentUserSection[],
): CourseUploadGroup[] {
  const grouped = new Map<string, CourseUploadGroup>();

  sections.filter(hasCourseDetails).forEach(section => {
    const key = `${section.courseId}:${section.year}:${section.semester}`;
    const course = grouped.get(key);
    if (course) {
      course.sections.push(section);
      return;
    }

    grouped.set(key, {
      courseName: section.courseName,
      key,
      sections: [section],
      semester: section.semester,
      year: section.year,
    });
  });

  return [...grouped.values()];
}
const uploadCopy: Record<
  UploadFileKind,
  { description: string; label: string; title: string }
> = {
  studentRoster: {
    description: '학번 필수, 이름·이메일·전화번호·역할 선택 Excel (.xls/.xlsx)',
    label: '학생 명단 파일 선택',
    title: '학생 명단',
  },
  teamRoster: {
    description: '팀명·학번 필수, 이름·팀장·역할 등 선택 Excel (.xls/.xlsx)',
    label: '팀 구성 명단 파일 선택',
    title: '팀 구성 명단',
  },
};

function getRosterImportStatusLabel(
  record: AdminRosterImportAppliedDto | null | undefined,
  isError: boolean,
  isPending: boolean,
) {
  if (isPending) return '불러오는 중입니다.';
  if (isError) return '업로드 현황을 불러오지 못했습니다.';
  if (!record || !record.fileName) return '파일 없음';

  return `${record.fileName} · ${formatRosterImportAppliedAt(record.appliedAt)}`;
}

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
  const sessionRole = useAuthStore(state => state.sessionRole);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const toast = useToast();
  const logoutMutation = useLogoutMutation();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);
  const [uploadKind, setUploadKind] = useState<UploadFileKind | null>(null);
  const [uploadCourseKey, setUploadCourseKey] = useState<string | null>(null);
  const [uploadSectionId, setUploadSectionId] = useState('');
  const currentUserSections = currentUser?.sections ?? [];
  const uploadSections = currentUserSections.filter(hasCourseDetails);
  const courseUploadGroups = useMemo(
    () => groupSectionsByCourse(uploadSections),
    [uploadSections],
  );
  const selectedUploadCourse = courseUploadGroups.find(
    course => course.key === uploadCourseKey,
  );
  const selectedUploadSections = (selectedUploadCourse?.sections ?? []).map(
    toUploadSection,
  );
  const rosterImportStatusQueries = useAdminRosterImportStatusQueries(
    uploadSections.map(section => section.id),
  );
  const rosterImportStatusBySectionId = new Map(
    rosterImportStatusQueries.map(({ query, sectionId }) => [sectionId, query]),
  );
  const hasUploadSections = uploadSections.length > 0;
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
  function openUploadDialog(kind: UploadFileKind, course: CourseUploadGroup) {
    const firstSection = course.sections[0];
    if (!firstSection) return;

    setUploadKind(kind);
    setUploadCourseKey(course.key);
    setUploadSectionId(String(firstSection.id));
  }

  function closeUploadDialog() {
    setUploadKind(null);
    setUploadCourseKey(null);
    setUploadSectionId('');
  }

  async function refreshCurrentUserSections() {
    if (!sessionRole) return;

    try {
      setCurrentUser(await fetchSessionUser(sessionRole));
    } catch {
      toast({ body: '분반 목록을 새로고침하지 못했습니다.' });
    }
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

      <AdminCourseManagement
        onSectionCreated={refreshCurrentUserSections}
        professorId={currentUser?.studentNumber}
      />

      <Card className={styles.uploadSection} padding={4}>
        <VStack gap={4}>
          <header className={styles.sectionHeader}>
            <Heading level={2}>데이터 업로드</Heading>
            <Text color='secondary' type='supporting'>
              학생 명단과 팀 구성 명단은 분반별 Excel 파일로 관리합니다.
            </Text>
          </header>

          {!hasUploadSections ? (
            <Text color='secondary' role='status'>
              담당 분반이 없어 명단 파일을 선택할 수 없습니다.
            </Text>
          ) : (
            <div className={styles.courseUploadGroups}>
              {courseUploadGroups.map(course => (
                <section className={styles.courseUploadGroup} key={course.key}>
                  <header className={styles.courseUploadHeader}>
                    <Heading level={3}>{course.courseName}</Heading>
                    <Text color='secondary' type='supporting'>
                      {course.year}년 {semesterLabel(course.semester)} · 분반{' '}
                      {course.sections.length}개
                    </Text>
                  </header>
                  <div className={styles.uploadGrid}>
                    <FileSelectionCard
                      isDisabled={false}
                      kind='studentRoster'
                      onOpen={() => openUploadDialog('studentRoster', course)}
                    />
                    <FileSelectionCard
                      isDisabled={false}
                      kind='teamRoster'
                      onOpen={() => openUploadDialog('teamRoster', course)}
                    />
                  </div>
                  <section
                    aria-label={`${course.courseName} 분반별 업로드 현황`}
                  >
                    <Heading level={4}>분반별 업로드 현황</Heading>
                    <div className={styles.statusGroups}>
                      {(['studentRoster', 'teamRoster'] as const).map(kind => (
                        <section key={kind}>
                          <Heading level={5}>{uploadCopy[kind].title}</Heading>
                          <ul className={styles.sectionStatusList}>
                            {course.sections.map(section => {
                              const statusQuery =
                                rosterImportStatusBySectionId.get(
                                  String(section.id),
                                );
                              const record = statusQuery?.data?.[kind];

                              return (
                                <li key={section.id}>
                                  <strong className={styles.sectionCode}>
                                    {section.code}
                                  </strong>
                                  <span className={styles.sectionFile}>
                                    {getRosterImportStatusLabel(
                                      record,
                                      statusQuery?.isError ?? false,
                                      statusQuery?.isPending ?? false,
                                    )}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </section>
                </section>
              ))}
            </div>
          )}
        </VStack>
      </Card>

      <AdminPreSurveyResponses sections={currentUserSections} />

      <EnrollmentImportDialog
        isOpen={uploadKind === 'studentRoster' && uploadSectionId !== ''}
        onClose={closeUploadDialog}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={selectedUploadSections}
      />
      <TeamImportDialog
        isOpen={uploadKind === 'teamRoster' && uploadSectionId !== ''}
        onClose={closeUploadDialog}
        onSectionChange={setUploadSectionId}
        sectionId={uploadSectionId}
        sections={selectedUploadSections}
      />
    </div>
  );
}
