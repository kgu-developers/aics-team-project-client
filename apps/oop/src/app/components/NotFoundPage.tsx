import { Button, Heading, Text, VStack } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className={styles.notFoundPage}>
      <VStack gap={4}>
        <Heading level={1}>페이지를 찾을 수 없어요.</Heading>
        <Text color='secondary' type='large'>
          현재 학생 흐름에 없는 주소입니다.
        </Text>
        <Button
          label='학생 홈으로 가기'
          onClick={() => navigate({ to: ROUTES.STUDENT.HOME })}
          variant='primary'
        />
      </VStack>
    </main>
  );
}
