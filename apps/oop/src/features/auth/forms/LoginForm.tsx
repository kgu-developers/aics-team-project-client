import {
  Button,
  Card,
  Heading,
  Text,
  TextInput,
  VStack,
} from '@aics/design-system';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { resolveStudentLoginDestination } from '~/features/team-assignment/resolveStudentLoginDestination';

import * as styles from './LoginForm.css';
import { useLoginMutation } from '../queries/useLoginMutation';

const loginSchema = z.object({
  studentNumber: z.string().trim().min(1, '학번을 입력해 주세요.'),
  password: z.string().min(1, '비밀번호를 입력해 주세요.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

type ApiErrorBody = {
  message?: string;
};

function getLoginErrorMessage(error: unknown) {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      return error.response.data.message ?? '로그인 정보를 다시 확인해 주세요.';
    }

    return '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return '네트워크 연결을 확인한 뒤 다시 시도해 주세요.';
}

export default function LoginForm() {
  const navigate = useNavigate();
  const loginMutation = useLoginMutation();
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = useForm<LoginFormValues>({
    defaultValues: {
      studentNumber: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async values => {
    try {
      const currentUser = await loginMutation.mutateAsync(values);
      const destination = await resolveStudentLoginDestination(currentUser);
      await navigate({ to: destination });
    } catch {
      // API failures are rendered below; they are not field-validation failures.
    }
  });

  const studentNumber = watch('studentNumber');
  const password = watch('password');
  const requestError = loginMutation.isError
    ? getLoginErrorMessage(loginMutation.error)
    : undefined;

  return (
    <section aria-labelledby='login-heading' className={styles.loginPage}>
      <Card className={styles.loginCard}>
        <form onSubmit={onSubmit}>
          <VStack gap={4}>
            <div>
              <p className={styles.eyebrow}>OOP Team Project</p>
              <Heading id='login-heading' level={1}>
                로그인
              </Heading>
              <Text color='secondary'>
                팀 프로젝트 운영 공간에 들어가기 위해 로그인해 주세요.
              </Text>
            </div>

            <TextInput
              htmlName={register('studentNumber').name}
              isRequired
              label='학번'
              onChange={value =>
                setValue('studentNumber', value, { shouldValidate: true })
              }
              placeholder='예: 20260001'
              status={
                errors.studentNumber
                  ? { message: errors.studentNumber.message, type: 'error' }
                  : undefined
              }
              statusVariant='detached'
              value={studentNumber}
              width='100%'
            />

            <TextInput
              htmlName={register('password').name}
              isRequired
              label='비밀번호'
              onChange={value =>
                setValue('password', value, { shouldValidate: true })
              }
              placeholder='비밀번호를 입력해 주세요.'
              status={
                errors.password
                  ? { message: errors.password.message, type: 'error' }
                  : undefined
              }
              statusVariant='detached'
              type='password'
              value={password}
              width='100%'
            />

            {requestError ? (
              <p className={styles.requestError} role='alert'>
                {requestError}
              </p>
            ) : null}

            <Button
              isDisabled={loginMutation.isPending}
              isLoading={loginMutation.isPending}
              label='로그인'
              type='submit'
              variant='primary'
              width='100%'
            />
          </VStack>
        </form>
      </Card>
    </section>
  );
}
