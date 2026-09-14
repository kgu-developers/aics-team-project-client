import { AstryxThemeProvider, Button, EmptyState } from '@aics/design-system';
import { useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';

export default function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  return (
    <AstryxThemeProvider>
      <main>
        <EmptyState
          title='화면을 불러오지 못했어요.'
          description='잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려주세요.'
          actions={
            <Button
              label='다시 시도'
              isDisabled={isRetrying}
              isLoading={isRetrying}
              onClick={async () => {
                setIsRetrying(true);
                try {
                  await router.invalidate();
                  reset();
                } finally {
                  setIsRetrying(false);
                }
              }}
            />
          }
        />
      </main>
    </AstryxThemeProvider>
  );
}
