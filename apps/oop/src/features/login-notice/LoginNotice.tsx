import { Button, Dialog, Heading, Text, VStack } from '@aics/design-system';
import { useState } from 'react';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { loginNotice } from '~/course/loginNotice';

import * as styles from './LoginNotice.css';
import { hideLoginNoticeForWeek, isLoginNoticeHidden } from './noticeDismissal';

export default function LoginNotice() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const user = useAuthStore(state => state.currentUser);

  if (!hasSession || user?.globalRole !== 'STUDENT') return null;

  return <StudentLoginNotice key={user.id} userId={user.id} />;
}

function StudentLoginNotice({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(() => !isLoginNoticeHidden(userId));
  const [storageError, setStorageError] = useState(false);

  return (
    <Dialog
      aria-labelledby='login-notice-title'
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      width={520}
    >
      <VStack gap={5}>
        <VStack gap={3}>
          <Text color='secondary' type='supporting'>
            수강생 안내
          </Text>
          <Heading id='login-notice-title' level={2}>
            {loginNotice.title}
          </Heading>
          <Text>{loginNotice.message}</Text>
        </VStack>
        {storageError ? (
          <Text role='alert'>
            이 브라우저에서 숨김 설정을 저장할 수 없습니다. 닫기를 눌러 안내를
            닫아 주세요.
          </Text>
        ) : null}
        <div className={styles.actions}>
          <Button
            label='일주일간 안 보기'
            onClick={() => {
              if (hideLoginNoticeForWeek(userId)) setIsOpen(false);
              else setStorageError(true);
            }}
            variant='secondary'
          />
          <Button label='닫기' onClick={() => setIsOpen(false)} />
        </div>
      </VStack>
    </Dialog>
  );
}
