import type {
  AdminOopCourseDto,
  AdminOopCourseInput,
  AdminOopCourseSemester,
  AdminOopCourseStatus,
  AdminOopSectionInput,
  AdminOopSectionDto,
} from '@aics/api-client';
import {
  Button,
  Card,
  DateTimeInput,
  Dialog,
  EmptyState,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  TextInput,
  useToast,
  VStack,
  type ISODateTimeString,
} from '@aics/design-system';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';

import {
  useAdminOopSectionsQuery,
  useSubmitAdminOopSectionMutation,
  useUpdateAdminOopSectionMutation,
  useUpdateAdminOopSectionContactVisibilityMutation,
} from '~/features/admin-section/queries';

import {
  useAdminOopCourseQuery,
  useAdminOopCoursesQuery,
  useRemoveAdminOopCourseMutation,
  useSubmitAdminOopCourseMutation,
  useUpdateAdminOopCourseMutation,
} from '../queries';
import * as styles from './AdminCourseManagement.css';

const semesterOptions: { label: string; value: AdminOopCourseSemester }[] = [
  { label: '1학기', value: 'SPRING' },
  { label: '여름학기', value: 'SUMMER' },
  { label: '2학기', value: 'FALL' },
  { label: '겨울학기', value: 'WINTER' },
];

const statusOptions: { label: string; value: AdminOopCourseStatus }[] = [
  { label: '임시 저장', value: 'DRAFT' },
  { label: '운영 중', value: 'ACTIVE' },
  { label: '보관됨', value: 'ARCHIVED' },
];

const initialInput: AdminOopCourseInput = {
  name: '',
  semester: 'FALL',
  status: 'DRAFT',
  year: new Date().getFullYear(),
};

type CourseFormInput = Omit<AdminOopCourseInput, 'year'> & { year: string };

function semesterLabel(value: AdminOopCourseSemester) {
  return semesterOptions.find(option => option.value === value)?.label ?? value;
}

function statusLabel(value: AdminOopCourseStatus) {
  return statusOptions.find(option => option.value === value)?.label ?? value;
}

function contactVisibilityStatus(visibleFrom: string, visibleUntil: string) {
  if (!visibleFrom && !visibleUntil) return '미설정';

  const startsAt = Date.parse(visibleFrom);
  const endsAt = Date.parse(visibleUntil);
  if (Number.isNaN(startsAt) || Number.isNaN(endsAt) || startsAt >= endsAt) {
    return '입력 확인 필요';
  }

  const now = Date.now();
  if (now < startsAt) return '공개 예정';
  if (now <= endsAt) return '공개 중';
  return '공개 종료';
}

function toInput(course: AdminOopCourseDto): CourseFormInput {
  return {
    name: course.name,
    semester: course.semester,
    status: course.status,
    year: String(course.year),
  };
}

function CourseFormDialog({
  courseId,
  isOpen,
  onClose,
}: {
  courseId: number | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const courseQuery = useAdminOopCourseQuery(courseId ?? undefined);
  const submitMutation = useSubmitAdminOopCourseMutation();
  const updateMutation = useUpdateAdminOopCourseMutation();
  const [input, setInput] = useState<CourseFormInput>({
    ...initialInput,
    year: String(initialInput.year),
  });
  const hydratedDialogKey = useRef<string | undefined>(undefined);
  const isEditing = courseId !== null;
  const mutation = isEditing ? updateMutation : submitMutation;

  useEffect(() => {
    if (!isOpen) {
      hydratedDialogKey.current = undefined;
      return;
    }
    if (!isEditing) {
      if (hydratedDialogKey.current === 'create') return;
      hydratedDialogKey.current = 'create';
      setInput({ ...initialInput, year: String(initialInput.year) });
      submitMutation.reset();
      return;
    }
    if (courseQuery.data) {
      const nextDialogKey = `edit:${courseQuery.data.id}`;
      if (hydratedDialogKey.current === nextDialogKey) return;
      hydratedDialogKey.current = nextDialogKey;
      setInput(toInput(courseQuery.data));
      updateMutation.reset();
    }
  }, [courseQuery.data, isEditing, isOpen, submitMutation, updateMutation]);

  function close() {
    if (!mutation.isPending) onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const year = Number(input.year);
    if (
      !input.name.trim() ||
      !Number.isInteger(year) ||
      year < 1 ||
      mutation.isPending
    )
      return;
    const normalizedInput: AdminOopCourseInput = {
      ...input,
      name: input.name.trim(),
      year,
    };

    if (courseId === null) {
      submitMutation.mutate(normalizedInput, {
        onSuccess: () => {
          toast({ body: '강좌를 등록했어요.' });
          onClose();
        },
      });
      return;
    }

    updateMutation.mutate(
      { courseId, input: normalizedInput },
      {
        onSuccess: () => {
          toast({ body: '강좌 정보를 수정했어요.' });
          onClose();
        },
      },
    );
  }

  return (
    <Dialog
      aria-label={isEditing ? '강좌 상세 및 수정' : '강좌 등록'}
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) close();
      }}
      purpose='form'
      width={520}
    >
      <div className={styles.dialogBody}>
        <Heading level={2}>
          {isEditing ? '강좌 상세 및 수정' : '강좌 등록'}
        </Heading>
        {isEditing && courseQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            강좌 정보를 불러오는 중입니다.
          </Text>
        ) : isEditing && courseQuery.isError ? (
          <Text role='alert'>강좌 정보를 불러오지 못했습니다.</Text>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <TextInput
              isDisabled={mutation.isPending}
              isRequired
              label='강좌명'
              onChange={name => setInput(current => ({ ...current, name }))}
              value={input.name}
              width='100%'
            />
            <div className={styles.formRow}>
              <TextInput
                isDisabled={mutation.isPending}
                isRequired
                label='연도'
                onChange={year => setInput(current => ({ ...current, year }))}
                value={input.year}
                width='100%'
              />
              <Selector
                isDisabled={mutation.isPending}
                label='학기'
                onChange={semester =>
                  setInput(current => ({
                    ...current,
                    semester: semester as AdminOopCourseSemester,
                  }))
                }
                options={semesterOptions}
                renderOption={option => (
                  <SelectorOption label={option.label ?? option.value} />
                )}
                value={input.semester}
                width='100%'
              />
            </div>
            <Selector
              isDisabled={mutation.isPending}
              label='운영 상태'
              onChange={status =>
                setInput(current => ({
                  ...current,
                  status: status as AdminOopCourseStatus,
                }))
              }
              options={statusOptions}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={input.status}
              width='100%'
            />
            <Text color='secondary' type='supporting'>
              운영을 종료할 때는 삭제 대신 상태를 보관됨으로 변경해 주세요.
            </Text>
            {mutation.isError ? (
              <Text className={styles.error} role='alert'>
                강좌 정보를 저장하지 못했습니다. 다시 시도해 주세요.
              </Text>
            ) : null}
            <HStack className={styles.dialogActions} gap={2} justify='end'>
              <Button
                isDisabled={mutation.isPending}
                label='취소'
                onClick={close}
                type='button'
                variant='secondary'
              />
              <Button
                isDisabled={
                  !input.name.trim() ||
                  !Number.isInteger(Number(input.year)) ||
                  Number(input.year) < 1 ||
                  mutation.isPending
                }
                isLoading={mutation.isPending}
                label={isEditing ? '수정 저장' : '등록'}
                type='submit'
              />
            </HStack>
          </form>
        )}
      </div>
    </Dialog>
  );
}

function SectionSettingsDialog({
  isOpen,
  onClose,
  onSaved,
  section,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<boolean>;
  section: AdminOopSectionDto | null;
}) {
  const toast = useToast();
  const updateSectionMutation = useUpdateAdminOopSectionMutation();
  const updateVisibilityMutation =
    useUpdateAdminOopSectionContactVisibilityMutation();
  const resetUpdateSectionMutation = updateSectionMutation.reset;
  const resetUpdateVisibilityMutation = updateVisibilityMutation.reset;
  const [capacity, setCapacity] = useState('');
  const [classTime, setClassTime] = useState('');
  const [code, setCode] = useState('');
  const [visibleFrom, setVisibleFrom] = useState('');
  const [visibleUntil, setVisibleUntil] = useState('');
  const [saveError, setSaveError] = useState<
    'basic' | 'visibility' | 'refresh' | null
  >(null);

  useEffect(() => {
    if (!isOpen || !section) return;
    setCapacity(String(section.capacity));
    setClassTime(section.classTime);
    setCode(section.code);
    setVisibleFrom(section.contactVisibleFrom ?? '');
    setVisibleUntil(section.contactVisibleUntil ?? '');
    resetUpdateSectionMutation();
    resetUpdateVisibilityMutation();
    setSaveError(null);
  }, [
    isOpen,
    resetUpdateSectionMutation,
    resetUpdateVisibilityMutation,
    section,
  ]);

  const isPending =
    updateSectionMutation.isPending || updateVisibilityMutation.isPending;
  const isVisibilityRangeValid =
    (!visibleFrom && !visibleUntil) ||
    (Boolean(visibleFrom && visibleUntil) &&
      Date.parse(visibleFrom) < Date.parse(visibleUntil));
  const visibilityStatus = contactVisibilityStatus(visibleFrom, visibleUntil);

  function visibilityInput() {
    return visibleFrom || visibleUntil
      ? { visibleFrom, visibleUntil }
      : { visibleFrom: null, visibleUntil: null };
  }

  async function finishSave() {
    const refreshed = await onSaved();
    if (!refreshed) {
      setSaveError('refresh');
      return;
    }
    toast({ body: '분반 설정을 저장했어요.' });
    onClose();
  }

  function saveVisibility() {
    if (!section || !isVisibilityRangeValid || isPending) return;
    setSaveError(null);
    updateVisibilityMutation.mutate(
      { sectionId: section.id, input: visibilityInput() },
      {
        onError: () => setSaveError('visibility'),
        onSuccess: () => void finishSave(),
      },
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCapacity = Number(capacity);
    if (
      !section ||
      !code.trim() ||
      !classTime.trim() ||
      !Number.isInteger(parsedCapacity) ||
      parsedCapacity < 1 ||
      !isVisibilityRangeValid ||
      isPending
    )
      return;

    setSaveError(null);
    updateSectionMutation.mutate(
      {
        sectionId: section.id,
        input: {
          capacity: parsedCapacity,
          classTime: classTime.trim(),
          code: code.trim(),
        },
      },
      {
        onError: () => setSaveError('basic'),
        onSuccess: saveVisibility,
      },
    );
  }

  return (
    <Dialog
      aria-label='분반 정보 수정'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open && !isPending) onClose();
      }}
      purpose='form'
      width={480}
    >
      <form className={styles.sectionSettingsForm} onSubmit={handleSubmit}>
        <Heading level={2}>{section?.code ?? '분반'} 분반 정보 수정</Heading>
        <TextInput
          isDisabled={isPending}
          isRequired
          label='분반 코드'
          onChange={setCode}
          value={code}
          width='100%'
        />
        <TextInput
          isDisabled={isPending}
          isRequired
          label='수업 시간'
          onChange={setClassTime}
          value={classTime}
          width='100%'
        />
        <TextInput
          isDisabled={isPending}
          isRequired
          label='정원'
          onChange={setCapacity}
          value={capacity}
          width='100%'
        />
        <section
          aria-labelledby='contact-visibility-heading'
          className={styles.optionalSettings}
        >
          <HStack
            className={styles.optionalSettingsHeader}
            gap={2}
            justify='between'
          >
            <VStack gap={1}>
              <Heading id='contact-visibility-heading' level={3}>
                연락처 공개 기간 (선택)
              </Heading>
              <Text color='secondary' type='supporting'>
                설정한 기간에만 학생에게 연락처가 공개됩니다.
              </Text>
            </VStack>
            <Text className={styles.optionalSettingsStatus} type='supporting'>
              {visibilityStatus}
            </Text>
          </HStack>
          <div className={styles.formRow}>
            <DateTimeInput
              isDisabled={isPending}
              label='공개 시작'
              onChange={value => setVisibleFrom(value ?? '')}
              value={
                visibleFrom ? (visibleFrom as ISODateTimeString) : undefined
              }
              width='100%'
            />
            <DateTimeInput
              isDisabled={isPending}
              label='공개 종료'
              onChange={value => setVisibleUntil(value ?? '')}
              value={
                visibleUntil ? (visibleUntil as ISODateTimeString) : undefined
              }
              width='100%'
            />
          </div>
          {!isVisibilityRangeValid && (visibleFrom || visibleUntil) ? (
            <Text className={styles.error} role='alert'>
              종료 시각은 시작 시각보다 뒤여야 합니다.
            </Text>
          ) : null}
          {visibleFrom || visibleUntil ? (
            <Button
              isDisabled={isPending}
              label='공개 기간 해제'
              onClick={() => {
                setVisibleFrom('');
                setVisibleUntil('');
              }}
              size='sm'
              type='button'
              variant='secondary'
            />
          ) : null}
        </section>
        {saveError === 'basic' ? (
          <Text className={styles.error} role='alert'>
            분반 기본 정보를 저장하지 못했습니다. 다시 시도해 주세요.
          </Text>
        ) : null}
        {saveError === 'visibility' ? (
          <VStack gap={2}>
            <Text className={styles.error} role='alert'>
              분반 기본 정보는 저장됐지만 연락처 공개 기간을 저장하지
              못했습니다.
            </Text>
            <Button
              label='공개 기간 다시 저장'
              onClick={saveVisibility}
              size='sm'
              type='button'
              variant='secondary'
            />
          </VStack>
        ) : null}
        {saveError === 'refresh' ? (
          <VStack gap={2}>
            <Text className={styles.error} role='alert'>
              저장됐지만 분반 목록을 새로고침하지 못했습니다.
            </Text>
            <Button
              label='분반 목록 새로고침'
              onClick={() => void finishSave()}
              size='sm'
              type='button'
              variant='secondary'
            />
          </VStack>
        ) : null}
        <HStack className={styles.dialogActions} gap={2} justify='end'>
          <Button
            isDisabled={isPending}
            label='취소'
            onClick={onClose}
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={
              !code.trim() ||
              !classTime.trim() ||
              !Number.isInteger(Number(capacity)) ||
              Number(capacity) < 1 ||
              !isVisibilityRangeValid ||
              isPending
            }
            isLoading={isPending}
            label='저장'
            type='submit'
          />
        </HStack>
      </form>
    </Dialog>
  );
}

function CourseSectionDialog({
  course,
  isOpen,
  onClose,
  onSectionCreated,
  professorId,
}: {
  course: AdminOopCourseDto | null;
  isOpen: boolean;
  onClose: () => void;
  onSectionCreated: () => Promise<boolean>;
  professorId: string | undefined;
}) {
  const toast = useToast();
  const sectionsQuery = useAdminOopSectionsQuery(
    course ? { courseId: course.id } : undefined,
  );
  const submitMutation = useSubmitAdminOopSectionMutation();
  const initializedDialog = useRef(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<AdminOopSectionDto | null>(
    null,
  );
  const [hasRefreshError, setHasRefreshError] = useState(false);
  const [input, setInput] = useState({
    capacity: '40',
    classTime: '',
    code: '',
  });

  useEffect(() => {
    if (!isOpen) {
      initializedDialog.current = false;
      return;
    }
    if (initializedDialog.current) return;
    initializedDialog.current = true;
    setIsCreating(false);
    setInput({ capacity: '40', classTime: '', code: '' });
    setHasRefreshError(false);
    submitMutation.reset();
  }, [isOpen, submitMutation]);

  function close() {
    if (!submitMutation.isPending) onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const capacity = Number(input.capacity);
    if (
      !course ||
      !professorId ||
      !input.code.trim() ||
      !input.classTime.trim() ||
      !Number.isInteger(capacity) ||
      capacity < 1 ||
      submitMutation.isPending
    ) {
      return;
    }

    const sectionInput: AdminOopSectionInput = {
      capacity,
      classTime: input.classTime.trim(),
      code: input.code.trim(),
      courseId: course.id,
      professorId,
    };
    submitMutation.mutate(sectionInput, {
      onSuccess: async () => {
        setIsCreating(false);
        setInput({ capacity: '40', classTime: '', code: '' });
        const refreshed = await onSectionCreated();
        if (!refreshed) {
          setHasRefreshError(true);
          return;
        }
        toast({ body: '분반을 등록했어요.' });
      },
    });
  }

  return (
    <>
      <Dialog
        aria-label={course ? `${course.name} 분반 관리` : '분반 관리'}
        isOpen={isOpen}
        onOpenChange={open => {
          if (!open) close();
        }}
        purpose='form'
        width={560}
      >
        <div className={styles.dialogBody}>
          <Heading level={2}>{course?.name ?? '강좌'} 분반 관리</Heading>
          {!professorId ? (
            <Text role='alert'>로그인한 관리자 정보를 확인할 수 없습니다.</Text>
          ) : sectionsQuery.isPending ? (
            <Text aria-live='polite' role='status'>
              연결된 분반을 불러오는 중입니다.
            </Text>
          ) : sectionsQuery.isError ? (
            <Text role='alert'>연결된 분반을 불러오지 못했습니다.</Text>
          ) : (sectionsQuery.data?.contents.length ?? 0) === 0 ? (
            <Text color='secondary'>등록된 분반이 없습니다.</Text>
          ) : (
            <ul aria-label='연결된 분반 목록' className={styles.sectionList}>
              {sectionsQuery.data?.contents.map(section => (
                <li className={styles.sectionItem} key={section.id}>
                  <strong>{section.code}</strong>
                  <span className={styles.sectionMeta}>
                    {section.classTime} · 정원 {section.capacity}명
                  </span>
                  <Button
                    className={styles.sectionEditButton}
                    label='분반 정보 수정'
                    onClick={() => setSectionToEdit(section)}
                    size='sm'
                    variant='secondary'
                    width='100%'
                  />
                </li>
              ))}
            </ul>
          )}
          {hasRefreshError ? (
            <HStack gap={2} justify='end'>
              <Text role='alert'>분반 목록을 새로고침하지 못했습니다.</Text>
              <Button
                label='분반 목록 새로고침'
                onClick={() =>
                  void onSectionCreated().then(success =>
                    setHasRefreshError(!success),
                  )
                }
                size='sm'
                variant='secondary'
              />
            </HStack>
          ) : null}
          {!isCreating ? (
            <HStack gap={2} justify='end'>
              <Button label='닫기' onClick={close} variant='secondary' />
              <Button
                isDisabled={!professorId || sectionsQuery.isPending}
                label='분반 등록'
                onClick={() => setIsCreating(true)}
              />
            </HStack>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <TextInput
                isDisabled={submitMutation.isPending}
                isRequired
                label='분반 코드'
                onChange={code => setInput(current => ({ ...current, code }))}
                placeholder='예) OOP-01'
                value={input.code}
                width='100%'
              />
              <TextInput
                isDisabled={submitMutation.isPending}
                isRequired
                label='수업 시간'
                onChange={classTime =>
                  setInput(current => ({ ...current, classTime }))
                }
                placeholder='예) 월요일 1-2교시'
                value={input.classTime}
                width='100%'
              />
              <TextInput
                isDisabled={submitMutation.isPending}
                isRequired
                label='정원'
                onChange={capacity =>
                  setInput(current => ({ ...current, capacity }))
                }
                value={input.capacity}
                width='100%'
              />
              <Text color='secondary' type='supporting'>
                담당 교수는 현재 로그인한 관리자 계정으로 등록됩니다.
              </Text>
              {submitMutation.isError ? (
                <Text className={styles.error} role='alert'>
                  분반을 등록하지 못했습니다. 다시 시도해 주세요.
                </Text>
              ) : null}
              <HStack className={styles.dialogActions} gap={2} justify='end'>
                <Button
                  isDisabled={submitMutation.isPending}
                  label='취소'
                  onClick={() => setIsCreating(false)}
                  type='button'
                  variant='secondary'
                />
                <Button
                  isDisabled={
                    !input.code.trim() ||
                    !input.classTime.trim() ||
                    !Number.isInteger(Number(input.capacity)) ||
                    Number(input.capacity) < 1 ||
                    submitMutation.isPending
                  }
                  isLoading={submitMutation.isPending}
                  label='등록'
                  type='submit'
                />
              </HStack>
            </form>
          )}
        </div>
      </Dialog>
      <SectionSettingsDialog
        isOpen={sectionToEdit !== null}
        onClose={() => setSectionToEdit(null)}
        onSaved={onSectionCreated}
        section={sectionToEdit}
      />
    </>
  );
}

function CourseDeleteDialog({
  course,
  isOpen,
  onClose,
}: {
  course: AdminOopCourseDto | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const removeMutation = useRemoveAdminOopCourseMutation();

  function close() {
    if (!removeMutation.isPending) onClose();
  }

  function removeCourse() {
    if (!course || removeMutation.isPending) return;

    removeMutation.mutate(course.id, {
      onSuccess: () => {
        toast({ body: '강좌를 삭제했어요.' });
        onClose();
      },
    });
  }

  return (
    <Dialog
      aria-label='강좌 삭제 확인'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) close();
      }}
      purpose='form'
      width={480}
    >
      <div className={styles.dialogBody}>
        <Heading level={2}>이 강좌를 삭제할까요?</Heading>
        <Text color='secondary'>삭제한 강좌는 복구할 수 없습니다.</Text>
        <Card className={styles.deletePreview} padding={3}>
          <Heading level={3}>{course?.name}</Heading>
          <Text color='secondary' type='supporting'>
            {course ? `${course.year}년 ${semesterLabel(course.semester)}` : ''}
          </Text>
        </Card>
        {removeMutation.isError ? (
          <Text className={styles.error} role='alert'>
            강좌를 삭제하지 못했습니다. 연결된 분반이 있다면 강좌 상태를
            보관됨으로 변경해 주세요.
          </Text>
        ) : null}
        <HStack className={styles.dialogActions} gap={2} justify='end'>
          <Button
            isDisabled={removeMutation.isPending}
            label='취소'
            onClick={close}
            variant='secondary'
          />
          <Button
            isLoading={removeMutation.isPending}
            label='삭제'
            onClick={removeCourse}
            variant='secondary'
          />
        </HStack>
      </div>
    </Dialog>
  );
}

export default function AdminCourseManagement({
  onSectionCreated,
  professorId,
}: {
  onSectionCreated: () => Promise<boolean>;
  professorId: string | undefined;
}) {
  const coursesQuery = useAdminOopCoursesQuery();
  const [yearFilter, setYearFilter] = useState('ALL');
  const [semesterFilter, setSemesterFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dialogCourseId, setDialogCourseId] = useState<
    number | null | undefined
  >(undefined);
  const [sectionManagementCourse, setSectionManagementCourse] =
    useState<AdminOopCourseDto | null>(null);
  const [courseToDelete, setCourseToDelete] =
    useState<AdminOopCourseDto | null>(null);
  const courses = coursesQuery.data?.contents ?? [];
  const years = [...new Set(courses.map(course => course.year))].sort(
    (left, right) => right - left,
  );
  const filteredCourses = useMemo(
    () =>
      courses.filter(
        course =>
          (yearFilter === 'ALL' || String(course.year) === yearFilter) &&
          (semesterFilter === 'ALL' || course.semester === semesterFilter) &&
          (statusFilter === 'ALL' || course.status === statusFilter),
      ),
    [courses, semesterFilter, statusFilter, yearFilter],
  );

  return (
    <Card padding={4}>
      <section
        aria-labelledby='course-management-title'
        className={styles.section}
      >
        <HStack justify='between'>
          <div className={styles.heading}>
            <Heading id='course-management-title' level={2}>
              강좌 관리
            </Heading>
            <Text color='secondary' type='supporting'>
              강좌를 등록하고 운영 상태를 관리합니다.
            </Text>
          </div>
          <Button label='강좌 등록' onClick={() => setDialogCourseId(null)} />
        </HStack>
        <div aria-label='강좌 필터' className={styles.filters} role='group'>
          <Selector
            label='연도'
            onChange={setYearFilter}
            options={[
              { label: '전체 연도', value: 'ALL' },
              ...years.map(year => ({
                label: `${year}년`,
                value: String(year),
              })),
            ]}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={yearFilter}
            width='100%'
          />
          <Selector
            label='학기'
            onChange={setSemesterFilter}
            options={[{ label: '전체 학기', value: 'ALL' }, ...semesterOptions]}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={semesterFilter}
            width='100%'
          />
          <Selector
            label='상태'
            onChange={setStatusFilter}
            options={[{ label: '전체 상태', value: 'ALL' }, ...statusOptions]}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={statusFilter}
            width='100%'
          />
        </div>
        {coursesQuery.isPending ? (
          <Text aria-live='polite' role='status'>
            강좌 목록을 불러오는 중입니다.
          </Text>
        ) : coursesQuery.isError ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='강좌 목록을 불러오지 못했습니다.'
          />
        ) : filteredCourses.length === 0 ? (
          <EmptyState
            description='필터를 바꾸거나 새 강좌를 등록해 주세요.'
            title='표시할 강좌가 없습니다.'
          />
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope='col'>강좌명</th>
                  <th scope='col'>연도</th>
                  <th scope='col'>학기</th>
                  <th scope='col'>상태</th>
                  <th scope='col'>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map(course => (
                  <tr key={course.id}>
                    <td>{course.name}</td>
                    <td>{course.year}</td>
                    <td>{semesterLabel(course.semester)}</td>
                    <td className={styles.status}>
                      {statusLabel(course.status)}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <Button
                          label='분반 관리'
                          onClick={() => setSectionManagementCourse(course)}
                          size='sm'
                          variant='secondary'
                        />
                        <Button
                          label='상세/수정'
                          onClick={() => setDialogCourseId(course.id)}
                          size='sm'
                          variant='secondary'
                        />
                        <Button
                          aria-describedby={`course-delete-hint-${course.id}`}
                          isDisabled={course.status !== 'DRAFT'}
                          label='삭제'
                          onClick={() => setCourseToDelete(course)}
                          size='sm'
                          variant='ghost'
                        />
                      </div>
                      <p
                        className={styles.deleteHint}
                        id={`course-delete-hint-${course.id}`}
                      >
                        {course.status === 'DRAFT'
                          ? '임시 저장 강좌만 삭제할 수 있습니다.'
                          : '운영을 종료할 때는 상태를 보관됨으로 변경해 주세요.'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <CourseFormDialog
        courseId={dialogCourseId ?? null}
        isOpen={dialogCourseId !== undefined}
        onClose={() => setDialogCourseId(undefined)}
      />
      <CourseSectionDialog
        course={sectionManagementCourse}
        isOpen={sectionManagementCourse !== null}
        onClose={() => setSectionManagementCourse(null)}
        onSectionCreated={onSectionCreated}
        professorId={professorId}
      />
      <CourseDeleteDialog
        course={courseToDelete}
        isOpen={courseToDelete !== null}
        onClose={() => setCourseToDelete(null)}
      />
    </Card>
  );
}
