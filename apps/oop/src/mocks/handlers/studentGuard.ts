import { HttpResponse } from 'msw';

import { getDemoUserAccount } from '../data/users';

export type StudentGuardResult = { response: Response } | { name: string };

/**
 * 문서 에디터 계열(제안서·중간보고서·발표) MSW 핸들러가 공유하는
 * 학생 접근 검증. 로그인 토큰과 STUDENT 역할만 확인하며,
 * 실제 백엔드 권한 계약의 증거가 아니다.
 */
export function requireStudent(
  request: Request,
  resourceLabel: string,
): StudentGuardResult {
  const token =
    request.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  const account = getDemoUserAccount(token);
  if (!account)
    return {
      response: HttpResponse.json(
        {
          code: 'UNAUTHORIZED',
          message: `로그인 후 ${resourceLabel}를 확인해 주세요.`,
        },
        { status: 401 },
      ),
    };
  if (account.user.globalRole !== 'STUDENT')
    return {
      response: HttpResponse.json(
        {
          code: 'STUDENT_ROLE_REQUIRED',
          message: '학생 계정만 접근할 수 있어요.',
        },
        { status: 403 },
      ),
    };
  return { name: account.user.name };
}
