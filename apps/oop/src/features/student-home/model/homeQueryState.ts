import { isAxiosError } from 'axios';

export type HomeQueryState = {
  status: 'ready' | 'pending' | 'error' | 'missing';
  description?: string;
  onRetry?: () => void;
  isFetching?: boolean;
};

export function homeQueryErrorDescription(error: unknown) {
  if (isAxiosError(error)) {
    if (error.response?.status === 401)
      return '로그인 상태를 확인한 뒤 다시 로그인해 주세요.';
    if (error.response?.status === 403)
      return '이 자료를 조회할 권한이 없어요. 소속 분반과 팀을 확인해 주세요.';
    if (error.response?.status === 404)
      return '조회할 자료를 찾지 못했어요. 등록 여부를 확인한 뒤 다시 시도해 주세요.';
  }
  return '잠시 후 다시 시도해 주세요.';
}

type QueryState = {
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => unknown;
};

export function homeQueryState(
  query: QueryState,
  missing?: string,
): HomeQueryState {
  if (missing) return { status: 'missing', description: missing };
  return {
    status: query.isError ? 'error' : query.isPending ? 'pending' : 'ready',
    description: query.isError
      ? homeQueryErrorDescription(query.error)
      : undefined,
    isFetching: query.isFetching,
    onRetry: () => {
      void query.refetch();
    },
  };
}
