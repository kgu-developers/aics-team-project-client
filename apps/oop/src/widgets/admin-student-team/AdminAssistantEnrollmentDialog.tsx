import type { AdminSectionEnrollmentDto } from '@aics/api-client';
import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  TextInput,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import {
  useRegisterAdminAssistantMutation,
  useUpdateAdminAssistantMutation,
} from '~/features/admin-student-team/queries';

import * as styles from './AdminStudentTeamManagement.css';

type AssistantInput = {
  email: string;
  name: string;
  password: string;
  phone: string;
  studentNumber: string;
};

const initialInput: AssistantInput = {
  email: '',
  name: '',
  password: '',
  phone: '',
  studentNumber: '',
};

export function AdminAssistantEnrollmentDialog({
  assistant,
  isOpen,
  onClose,
  sectionId,
  sectionName,
}: {
  assistant?: AdminSectionEnrollmentDto | null;
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionName: string;
}) {
  const registerMutation = useRegisterAdminAssistantMutation();
  const updateMutation = useUpdateAdminAssistantMutation();
  const isEditing = Boolean(assistant);
  const mutation = isEditing ? updateMutation : registerMutation;
  const { reset } = mutation;
  const [input, setInput] = useState(initialInput);

  useEffect(() => {
    if (!isOpen) return;
    setInput(
      assistant
        ? {
            email: assistant.email,
            name: assistant.name,
            password: '',
            phone: assistant.phone,
            studentNumber: assistant.studentNumber,
          }
        : initialInput,
    );
    reset();
  }, [assistant, isOpen, reset]);

  const isValid =
    input.studentNumber.trim().length > 0 &&
    input.name.trim().length > 0 &&
    input.email.trim().length > 0 &&
    input.phone.trim().length > 0 &&
    (isEditing || input.password.trim().length > 0);

  function updateField(field: keyof AssistantInput, value: string) {
    setInput(current => ({ ...current, [field]: value }));
  }

  function submit() {
    if (!isValid || mutation.isPending) return;

    if (assistant) {
      updateMutation.mutate(
        {
          input: {
            email: input.email.trim(),
            globalRole: 'USER',
            name: input.name.trim(),
            ...(input.password.trim() ? { password: input.password } : {}),
            phone: input.phone.trim(),
          },
          studentNumber: assistant.studentNumber,
        },
        { onSuccess: onClose },
      );
      return;
    }

    registerMutation.mutate(
      {
        sectionId,
        user: {
          email: input.email.trim(),
          globalRole: 'USER',
          name: input.name.trim(),
          password: input.password,
          phone: input.phone.trim(),
          studentNumber: input.studentNumber.trim(),
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog
      aria-label={isEditing ? '조교 정보 수정' : '조교 등록'}
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open && !mutation.isPending) onClose();
      }}
      purpose='form'
      width={520}
    >
      <form
        className={styles.assistantDialogContent}
        onSubmit={event => {
          event.preventDefault();
          submit();
        }}
      >
        <Heading level={2}>
          {sectionName} {isEditing ? '조교 정보 수정' : '조교 등록'}
        </Heading>
        <Text color='secondary' type='supporting'>
          {isEditing
            ? '이름, 이메일, 전화번호를 수정할 수 있습니다. 비밀번호는 입력한 경우에만 변경됩니다.'
            : '학번 계정이 없으면 먼저 생성한 뒤, 이 분반에 조교로 등록합니다. 기존 계정이면 계정 생성 없이 분반 등록만 진행합니다.'}
        </Text>
        <TextInput
          aria-label='학번'
          isDisabled={isEditing}
          isRequired
          label='학번'
          onChange={value => updateField('studentNumber', value)}
          value={input.studentNumber}
          width='100%'
        />
        <TextInput
          aria-label='이름'
          isRequired
          label='이름'
          onChange={value => updateField('name', value)}
          value={input.name}
          width='100%'
        />
        <TextInput
          aria-label='이메일'
          isRequired
          label='이메일'
          onChange={value => updateField('email', value)}
          type='email'
          value={input.email}
          width='100%'
        />
        <TextInput
          aria-label='전화번호'
          isRequired
          label='전화번호'
          onChange={value => updateField('phone', value)}
          value={input.phone}
          width='100%'
        />
        <TextInput
          aria-label='초기 비밀번호'
          isRequired={!isEditing}
          label={isEditing ? '새 비밀번호 (선택)' : '초기 비밀번호'}
          onChange={value => updateField('password', value)}
          type='password'
          value={input.password}
          width='100%'
        />
        {mutation.isError ? (
          <Text role='alert'>
            조교 정보를 저장하지 못했습니다. 입력값과 분반 등록 상태를 확인해
            주세요.
          </Text>
        ) : null}
        <HStack gap={2} justify='end'>
          <Button
            isDisabled={mutation.isPending}
            label='취소'
            onClick={onClose}
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={!isValid || mutation.isPending}
            label={
              mutation.isPending
                ? '저장 중'
                : isEditing
                  ? '수정 저장'
                  : '조교 등록'
            }
            type='submit'
          />
        </HStack>
      </form>
    </Dialog>
  );
}
