import { Button, Dialog, Heading, Text, VStack } from '@aics/design-system';
import { useEffect, useState } from 'react';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { loginNotice } from '~/course/loginNotice';

import * as styles from './LoginNotice.css';
import {
  getLoginNoticeHiddenUntil,
  hideLoginNoticeForWeek,
} from './noticeDismissal';

export default function LoginNotice() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const user = useAuthStore(state => state.currentUser);

  if (!hasSession || user?.globalRole !== 'STUDENT') return null;

  return <StudentLoginNotice key={user.id} userId={user.id} />;
}

function StudentLoginNotice({ userId }: { userId: string }) {
  const [hiddenUntil, setHiddenUntil] = useState(() =>
    getLoginNoticeHiddenUntil(userId),
  );
  const [isClosed, setIsClosed] = useState(false);
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const remaining = hiddenUntil - Date.now();
    if (remaining <= 0) return;

    const checkExpiry = () => {
      if (Date.now() >= hiddenUntil) setHiddenUntil(0);
    };
    // Focus also catches expiry after a background tab or device suspension.
    const timer = window.setTimeout(
      checkExpiry,
      Math.min(remaining, 2_147_483_647),
    );
    window.addEventListener('focus', checkExpiry);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('focus', checkExpiry);
    };
  }, [hiddenUntil]);

  return (
    <Dialog
      aria-labelledby='login-notice-title'
      isOpen={!isClosed && hiddenUntil <= Date.now()}
      onOpenChange={isOpen => setIsClosed(!isOpen)}
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
              if (hideLoginNoticeForWeek(userId)) {
                setHiddenUntil(getLoginNoticeHiddenUntil(userId));
              } else setStorageError(true);
            }}
            variant='secondary'
          />
          <Button label='닫기' onClick={() => setIsClosed(true)} />
        </div>
      </VStack>
    </Dialog>
  );
}
