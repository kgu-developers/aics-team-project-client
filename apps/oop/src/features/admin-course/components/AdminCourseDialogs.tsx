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
  DateInput,
  Dialog,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  TextInput,
  TimeInput,
  useToast,
  VStack,
  type TimeInputProps,
} from '@aics/design-system';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import {
  useRemoveAdminOopSectionMutation,
  useSubmitAdminOopSectionMutation,
  useUpdateAdminOopSectionMutation,
  useUpdateAdminOopSectionContactVisibilityMutation,
} from '~/features/admin-section/queries';
import {
  useAdminSectionEnrollmentsQuery,
  useWithdrawAdminSectionEnrollmentMutation,
} from '~/features/admin-student-team/queries';

import { AdminAssistantEnrollmentDialog } from '~/widgets/admin-student-team/AdminAssistantEnrollmentDialog';

import {
  useAdminOopCourseQuery,
  useRemoveAdminOopCourseMutation,
  useSubmitAdminOopCourseMutation,
  useUpdateAdminOopCourseMutation,
} from '../queries';
import * as styles from './AdminCourseDialogs.css';
import {
  contactVisibilityStatus,
  semesterLabel,
  semesterOptions,
  statusOptions,
} from '../model/courseLabels';

const initialInput: AdminOopCourseInput = {
  name: '',
  semester: 'FALL',
  status: 'DRAFT',
  year: new Date().getFullYear(),
};

type CourseFormInput = Omit<AdminOopCourseInput, 'year'> & { year: string };

type DateTimeDraft = { date: string; time: string };
type DateValue =
  `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

function toDateTimeDraft(value: string): DateTimeDraft {
  const date = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? '';
  const time = /T(\d{2}:\d{2})/.exec(value)?.[1] ?? '';
  return { date, time };
}

function toDateTimeValue(draft: DateTimeDraft) {
  if (draft.date && draft.time) return `${draft.date}T${draft.time}:00`;
  if (draft.date) return `${draft.date}T`;
  if (draft.time) return `T${draft.time}`;
  return '';
}

function SectionAssistantPanel({ section }: { section: AdminOopSectionDto }) {
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false);
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(String(section.id));
  const withdrawAssistantMutation = useWithdrawAdminSectionEnrollmentMutation();
  const assistants = (enrollmentsQuery.data?.contents ?? []).filter(
    enrollment =>
      enrollment.role === 'ASSISTANT' && enrollment.status === 'ACTIVE',
  );
  const [assistantToEdit, setAssistantToEdit] = useState<
    (typeof assistants)[number] | null
  >(null);
  const [assistantToDelete, setAssistantToDelete] = useState<
    (typeof assistants)[number] | null
  >(null);

  function closeAssistantWithdrawalDialog() {
    if (withdrawAssistantMutation.isPending) return;
    setAssistantToDelete(null);
    withdrawAssistantMutation.reset();
  }

  return (
    <>
      <div className={styles.assistantManagement}>
        <Text className={styles.sectionMeta} type='supporting'>
          {enrollmentsQuery.isPending
            ? '조교 정보를 불러오는 중입니다.'
            : assistants.length > 0
              ? `조교 ${assistants.length}명`
              : '등록된 조교가 없습니다.'}
        </Text>
        {assistants.map(assistant => (
          <HStack
            className={styles.assistantRow}
            key={`${section.id}:${assistant.studentNumber}`}
            justify='between'
          >
            <Text type='supporting'>
              {assistant.name} · {assistant.studentNumber}
            </Text>
            <HStack className={styles.assistantActions} gap={1}>
              <Button
                label='수정'
                onClick={() => setAssistantToEdit(assistant)}
                size='sm'
                variant='ghost'
              />
              <Button
                isDisabled={withdrawAssistantMutation.isPending}
                label='분반에서 제외'
                onClick={() => setAssistantToDelete(assistant)}
                size='sm'
                variant='ghost'
              />
            </HStack>
          </HStack>
        ))}
        <div className={styles.assistantManagementAction}>
          <Button
            label='조교 등록'
            onClick={() => setIsEnrollmentDialogOpen(true)}
            size='sm'
            variant='secondary'
          />
        </div>
      </div>
      <AdminAssistantEnrollmentDialog
        assistant={null}
        isOpen={isEnrollmentDialogOpen}
        onClose={() => setIsEnrollmentDialogOpen(false)}
        sectionId={String(section.id)}
        sectionName={section.code}
      />
      <Dialog
        aria-label='조교 분반 제외 확인'
        isOpen={assistantToDelete !== null}
        onOpenChange={open => {
          if (!open) closeAssistantWithdrawalDialog();
        }}
        purpose='info'
        role='alertdialog'
        width={440}
      >
        {assistantToDelete ? (
          <div className={styles.dialogBody}>
            <Heading level={2}>조교를 이 분반에서 제외할까요?</Heading>
            <Text>
              {assistantToDelete.name} 조교는 이 분반의 조교 목록에서만
              제외됩니다. 계정과 다른 분반 소속은 유지됩니다.
            </Text>
            {withdrawAssistantMutation.isError ? (
              <Text className={styles.error} role='alert'>
                조교를 분반에서 제외하지 못했습니다. 다시 시도해 주세요.
              </Text>
            ) : null}
            <HStack className={styles.dialogActions} gap={2} justify='end'>
              <Button
                isDisabled={withdrawAssistantMutation.isPending}
                label='취소'
                onClick={closeAssistantWithdrawalDialog}
                variant='secondary'
              />
              <Button
                isDisabled={withdrawAssistantMutation.isPending}
                isLoading={withdrawAssistantMutation.isPending}
                label='분반에서 제외'
                onClick={() =>
                  withdrawAssistantMutation.mutate(
                    {
                      sectionId: String(section.id),
                      studentNumber: assistantToDelete.studentNumber,
                    },
                    { onSuccess: closeAssistantWithdrawalDialog },
                  )
                }
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
      <AdminAssistantEnrollmentDialog
        assistant={assistantToEdit}
        isOpen={assistantToEdit !== null}
        onClose={() => setAssistantToEdit(null)}
        sectionId={String(section.id)}
        sectionName={section.code}
      />
    </>
  );
}

/** 조교 목록·등록·수정·제외를 다루는 분반별 대화상자. */
export function SectionAssistantManagement({
  isOpen,
  onClose,
  section,
}: {
  isOpen: boolean;
  onClose: () => void;
  section: AdminOopSectionDto;
}) {
  return (
    <Dialog
      aria-label={`${section.code} 조교 관리`}
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      purpose='info'
      width={520}
    >
      <div className={styles.dialogBody}>
        <Heading className={styles.dialogTitle} level={2}>
          {section.code} 조교 관리
        </Heading>
        <SectionAssistantPanel section={section} />
        <HStack gap={2} justify='end'>
          <Button label='닫기' onClick={onClose} variant='secondary' />
        </HStack>
      </div>
    </Dialog>
  );
}

function toInput(course: AdminOopCourseDto): CourseFormInput {
  return {
    name: course.name,
    semester: course.semester,
    status: course.status,
    year: String(course.year),
  };
}

export function CourseFormDialog({
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
      purpose='info'
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

export function SectionSettingsDialog({
  isOpen,
  onClose,
  onDeleted,
  onSaved,
  section,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => Promise<boolean>;
  onSaved: () => Promise<boolean>;
  section: AdminOopSectionDto | null;
}) {
  const toast = useToast();
  const updateSectionMutation = useUpdateAdminOopSectionMutation();
  const removeSectionMutation = useRemoveAdminOopSectionMutation();
  const updateVisibilityMutation =
    useUpdateAdminOopSectionContactVisibilityMutation();
  const resetUpdateSectionMutation = updateSectionMutation.reset;
  const resetRemoveSectionMutation = removeSectionMutation.reset;
  const resetUpdateVisibilityMutation = updateVisibilityMutation.reset;
  const [capacity, setCapacity] = useState('');
  const [classTime, setClassTime] = useState('');
  const [code, setCode] = useState('');
  const [visibleFrom, setVisibleFrom] = useState('');
  const [visibleUntil, setVisibleUntil] = useState('');
  const [saveError, setSaveError] = useState<
    'basic' | 'visibility' | 'refresh' | 'delete' | 'deleteRefresh' | null
  >(null);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen || !section) return;
    setCapacity(String(section.capacity));
    setClassTime(section.classTime);
    setCode(section.code);
    setVisibleFrom(section.contactVisibleFrom ?? '');
    setVisibleUntil(section.contactVisibleUntil ?? '');
    resetUpdateSectionMutation();
    resetRemoveSectionMutation();
    resetUpdateVisibilityMutation();
    setSaveError(null);
    setIsDeleteConfirming(false);
  }, [
    isOpen,
    resetUpdateSectionMutation,
    resetRemoveSectionMutation,
    resetUpdateVisibilityMutation,
    section,
  ]);

  const isPending =
    updateSectionMutation.isPending ||
    removeSectionMutation.isPending ||
    updateVisibilityMutation.isPending;
  const isVisibilityRangeValid =
    (!visibleFrom && !visibleUntil) ||
    (Boolean(visibleFrom && visibleUntil) &&
      seoulInstant(visibleFrom) < seoulInstant(visibleUntil));
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

  function removeSection() {
    if (!section || isPending) return;

    setSaveError(null);
    removeSectionMutation.mutate(section.id, {
      onError: () => setSaveError('delete'),
      onSuccess: async () => {
        const refreshed = await onDeleted();
        if (!refreshed) {
          setSaveError('deleteRefresh');
          return;
        }
        toast({ body: '분반을 삭제했어요.' });
        onClose();
      },
    });
  }

  async function retrySectionListRefresh() {
    const refreshed = await onDeleted();
    if (!refreshed) return;

    setSaveError(null);
    setIsDeleteConfirming(false);
    onClose();
  }

  return (
    <Dialog
      aria-label='분반 정보 수정'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open && !isPending) onClose();
      }}
      purpose='info'
      width={600}
    >
      <form className={styles.sectionSettingsForm} onSubmit={handleSubmit}>
        <Heading className={styles.dialogTitle} level={2}>
          {section?.code ?? '분반'} 분반 정보 수정
        </Heading>
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
          <div className={styles.visibilityFields}>
            {(
              [
                ['공개 시작', visibleFrom, setVisibleFrom],
                ['공개 종료', visibleUntil, setVisibleUntil],
              ] as const
            ).map(([label, value, setValue]) => {
              const draft = toDateTimeDraft(value);
              const updateDraft = (next: Partial<DateTimeDraft>) =>
                setValue(toDateTimeValue({ ...draft, ...next }));

              return (
                <div className={styles.dateTimeFields} key={label}>
                  <DateInput
                    isDisabled={isPending}
                    label={`${label} 날짜`}
                    onChange={date => updateDraft({ date: date ?? '' })}
                    placeholder='날짜 선택'
                    value={draft.date ? (draft.date as DateValue) : undefined}
                    width='100%'
                  />
                  <TimeInput
                    hourFormat='24h'
                    isDisabled={isPending}
                    label={`${label} 시간`}
                    onChange={time => updateDraft({ time: time ?? '' })}
                    value={
                      draft.time
                        ? (draft.time as TimeInputProps['value'])
                        : undefined
                    }
                    width='100%'
                  />
                </div>
              );
            })}
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
        {saveError === 'delete' ? (
          <Text className={styles.error} role='alert'>
            분반을 삭제하지 못했습니다. 수강생 또는 팀이 연결된 분반은 삭제할 수
            없을 수 있습니다.
          </Text>
        ) : null}
        {saveError === 'deleteRefresh' ? (
          <VStack gap={2}>
            <Text className={styles.error} role='alert'>
              분반은 삭제됐지만 목록을 새로고침하지 못했습니다.
            </Text>
            <Button
              label='분반 목록 새로고침'
              onClick={() => void retrySectionListRefresh()}
              size='sm'
              type='button'
              variant='secondary'
            />
          </VStack>
        ) : null}
        {isDeleteConfirming ? (
          <Text className={styles.error} role='alert'>
            삭제한 분반은 복구할 수 없습니다. 수강생 또는 팀이 연결된 분반은
            삭제되지 않을 수 있습니다.
          </Text>
        ) : null}
        <HStack className={styles.dialogActions} gap={2} justify='end'>
          {isDeleteConfirming ? (
            <>
              <Button
                isDisabled={isPending}
                label='삭제 취소'
                onClick={() => setIsDeleteConfirming(false)}
                type='button'
                variant='secondary'
              />
              <Button
                isDisabled={isPending}
                isLoading={removeSectionMutation.isPending}
                label='분반 삭제 확인'
                onClick={removeSection}
                type='button'
                variant='ghost'
              />
            </>
          ) : (
            <Button
              isDisabled={isPending}
              label='분반 삭제'
              onClick={() => setIsDeleteConfirming(true)}
              type='button'
              variant='ghost'
            />
          )}
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

export function SectionCreateDialog({
  course,
  isOpen,
  onClose,
  onCreated,
  professorId,
}: {
  course: AdminOopCourseDto;
  isOpen: boolean;
  onClose: () => void;
  /** Refreshes section list + session; resolves false when that refresh failed. */
  onCreated: () => Promise<boolean>;
  professorId: string | undefined;
}) {
  const toast = useToast();
  const submitMutation = useSubmitAdminOopSectionMutation();
  const [input, setInput] = useState({
    capacity: '40',
    classTime: '',
    code: '',
  });
  const [hasRefreshError, setHasRefreshError] = useState(false);

  function close() {
    if (submitMutation.isPending) return;
    setInput({ capacity: '40', classTime: '', code: '' });
    setHasRefreshError(false);
    submitMutation.reset();
    onClose();
  }

  const capacity = Number(input.capacity);
  const isValid =
    Boolean(professorId) &&
    input.code.trim().length > 0 &&
    input.classTime.trim().length > 0 &&
    Number.isInteger(capacity) &&
    capacity >= 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || !professorId || submitMutation.isPending) return;

    const sectionInput: AdminOopSectionInput = {
      capacity,
      classTime: input.classTime.trim(),
      code: input.code.trim(),
      courseId: course.id,
      professorId,
    };
    submitMutation.mutate(sectionInput, {
      onSuccess: async () => {
        const refreshed = await onCreated();
        if (!refreshed) {
          setHasRefreshError(true);
          return;
        }
        toast({ body: '분반을 등록했어요.' });
        close();
      },
    });
  }

  return (
    <Dialog
      aria-label={`${course.name} 분반 등록`}
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) close();
      }}
      purpose='form'
      width={520}
    >
      <div className={styles.dialogBody}>
        <Heading className={styles.dialogTitle} level={2}>
          분반 등록
        </Heading>
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
          {!professorId ? (
            <Text role='alert'>로그인한 관리자 정보를 확인할 수 없습니다.</Text>
          ) : null}
          {submitMutation.isError ? (
            <Text className={styles.error} role='alert'>
              분반을 등록하지 못했습니다. 다시 시도해 주세요.
            </Text>
          ) : null}
          {hasRefreshError ? (
            <HStack gap={2} justify='end'>
              <Text role='alert'>분반 목록을 새로고침하지 못했습니다.</Text>
              <Button
                label='분반 목록 새로고침'
                onClick={() =>
                  void onCreated().then(success => {
                    setHasRefreshError(!success);
                    if (success) close();
                  })
                }
                size='sm'
                variant='secondary'
              />
            </HStack>
          ) : null}
          <HStack className={styles.dialogActions} gap={2} justify='end'>
            <Button
              isDisabled={submitMutation.isPending}
              label='취소'
              onClick={close}
              type='button'
              variant='secondary'
            />
            <Button
              isDisabled={!isValid || submitMutation.isPending}
              isLoading={submitMutation.isPending}
              label='등록'
              type='submit'
            />
          </HStack>
        </form>
      </div>
    </Dialog>
  );
}

export function CourseDeleteDialog({
  course,
  isOpen,
  onClose,
  onDeleted,
}: {
  course: AdminOopCourseDto | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
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
        onDeleted?.();
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
      purpose='info'
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
            강좌를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.
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
