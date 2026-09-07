import { Button, EmptyState } from '@aics/design-system';

import type { HomeQueryState } from '~/features/student-home/model/homeQueryState';

type Props = { state: HomeQueryState; label: string; className?: string };

export default function StudentHomeShortcutState({
  state,
  label,
  className,
}: Props) {
  if (state.status === 'ready') return null;

  return (
    <EmptyState
      className={className}
      title={
        state.status === 'pending'
          ? `${label} 조회 중...`
          : state.status === 'missing'
            ? `${label} 조회를 준비하고 있어요.`
            : `${label} 조회에 실패했어요.`
      }
      description={state.description}
      isCompact
      actions={
        state.status === 'error' && state.onRetry ? (
          <Button
            label={`${label} 다시 시도`}
            isLoading={state.isFetching}
            onClick={state.onRetry}
            variant='secondary'
            size='sm'
          />
        ) : undefined
      }
    />
  );
}
