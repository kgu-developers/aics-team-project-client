import {
  API_BASE_URL,
  ENDPOINTS,
  fetchAdminTeam,
  updateAdminTeamMember,
} from '@aics/api-client';
import { AstryxThemeProvider } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import AdminStudentTeamManagement from './AdminStudentTeamManagement';

import { demoAdmin, demoAdminAccessToken } from '~/mocks/data/users';
import { adminCourseHandlers } from '~/mocks/handlers/adminCourses';
import {
  adminStudentTeamHandlers,
  resetAdminStudentTeamMockState,
} from '~/mocks/handlers/adminStudentTeams';
import { renderWithRouter } from '~/test/renderWithRouter';

const server = setupServer(...adminCourseHandlers, ...adminStudentTeamHandlers);
const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });

  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});
afterEach(() => {
  server.resetHandlers();
  resetAdminStudentTeamMockState();
  useAuthStore.getState().clearSession();
});
afterAll(() => {
  server.close();

  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <AstryxThemeProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AstryxThemeProvider>
    );
  };
}

function renderPage(currentUser = demoAdmin, initialSectionId?: string) {
  useAuthStore.getState().setAccessToken(demoAdminAccessToken);
  useAuthStore.getState().setCurrentUser(currentUser);

  const Wrapper = createWrapper();

  return renderWithRouter(
    <Wrapper>
      <AdminStudentTeamManagement initialSectionId={initialSectionId} />
    </Wrapper>,
  );
}

describe('AdminStudentTeamManagement', () => {
  it('운영 분반을 확인하는 동안 분반 정보 오류를 표시하지 않는다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, async () => {
        await delay(1_000);
        return HttpResponse.json({ contents: [] });
      }),
    );

    renderPage();

    expect(
      await screen.findByText('운영 중인 분반을 불러오는 중입니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('분반 정보를 불러오지 못했습니다.'),
    ).not.toBeInTheDocument();
  });

  it('운영 분반 조회 실패를 빈 분반 선택과 구분한다', async () => {
    server.use(
      http.get(`${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_COURSES}`, () =>
        HttpResponse.json({ code: 'INTERNAL_SERVER_ERROR' }, { status: 500 }),
      ),
    );

    renderPage();

    expect(
      await screen.findByText(
        '운영 중인 분반을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('분반 정보를 불러오지 못했습니다.'),
    ).not.toBeInTheDocument();
  });

  it('로그인한 관리자가 맡은 여러 분반을 표시하고 선택을 전환한다', async () => {
    const user = userEvent.setup();

    renderPage({
      ...demoAdmin,
      sections: [
        ...demoAdmin.sections,
        {
          ...demoAdmin.sections[0]!,
          id: 'oop-2026-2-02',
          code: 'OOP-02',
          name: '객체지향프로그래밍 02분반',
          role: 'ASSISTANT',
        },
      ],
    });

    const sectionSelect = await screen.findByRole('combobox', {
      name: '분반',
    });
    await waitFor(() => expect(sectionSelect).toHaveTextContent('OOP-01'));

    await user.click(sectionSelect);
    await user.click(await screen.findByRole('option', { name: 'OOP-02' }));

    expect(
      await screen.findByRole('heading', { name: 'OOP-02 팀 구성' }),
    ).toBeInTheDocument();
  });

  it('직접 전달된 분반을 처음부터 선택해 수강생 관리를 연다', async () => {
    renderPage(
      {
        ...demoAdmin,
        sections: [
          ...demoAdmin.sections,
          {
            ...demoAdmin.sections[0]!,
            code: 'OOP-02',
            id: '2',
            name: '객체지향프로그래밍 02분반',
          },
        ],
      },
      '2',
    );

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: '분반' })).toHaveTextContent(
        'OOP-02',
      ),
    );
  });

  it('직접 전달된 분반이 담당 목록에 없으면 다른 분반으로 대체하지 않는다', async () => {
    renderPage(demoAdmin, '999');

    expect(
      await screen.findByText('분반 정보를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /팀 구성/ }),
    ).not.toBeInTheDocument();
  });

  it('로그인한 관리자의 분반 목록을 분반 선택 UI에 표시한다', async () => {
    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: '분반' })).toHaveTextContent(
        'OOP-01',
      ),
    );
    expect(screen.queryByText('1151 (월6)')).not.toBeInTheDocument();
  });

  it('수강생과 팀 구성을 Swagger 응답의 학번과 전공 기준으로 표시한다', async () => {
    renderPage();

    expect((await screen.findAllByText('김민준')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('20231234')).toHaveLength(2);
    expect(
      screen.getByRole('columnheader', { name: '전공' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1팀' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2팀' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '1팀' })).toHaveAttribute(
      'href',
      expect.stringContaining('/admin/teams/1'),
    );
  });

  it('수강생 목록의 이름을 누르면 학생 상세 모달을 연다', async () => {
    const user = userEvent.setup();

    renderPage();

    const studentNameButton = (
      await screen.findAllByRole('button', { name: '김민준' })
    ).find(button => button.closest('table'));
    expect(studentNameButton).toBeDefined();
    await user.click(studentNameButton!);

    const dialog = await screen.findByRole('dialog', {
      name: '김민준 수강생 정보',
    });
    expect(within(dialog).getByText('20231234')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: '비밀번호 초기화' }),
    ).toBeInTheDocument();
  });

  it('취소 가능한 알림만 바깥 클릭으로 닫고 입력·필수 확인은 유지한다', async () => {
    const user = userEvent.setup();

    renderPage();

    const studentNameButton = (
      await screen.findAllByRole('button', { name: '김민준' })
    ).find(button => button.closest('table'));
    expect(studentNameButton).toBeDefined();
    const studentRow = studentNameButton!.closest('tr') as HTMLElement;

    await user.click(
      within(studentRow).getByRole('button', { name: '김민준 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '제외' }));
    const confirmationDialog = await screen.findByRole('alertdialog', {
      name: '수강생 제외 확인',
    });
    await user.click(confirmationDialog);
    await waitFor(() =>
      expect(
        screen.queryByRole('alertdialog', { name: '수강생 제외 확인' }),
      ).not.toBeInTheDocument(),
    );

    const [changeLeaderButton] = screen.getAllByRole('button', {
      name: '팀장 변경',
    });
    expect(changeLeaderButton).toBeDefined();
    await user.click(changeLeaderButton!);
    const formDialog = await screen.findByRole('dialog', {
      name: '팀장 변경',
    });
    await user.click(formDialog);
    expect(screen.getByRole('dialog', { name: '팀장 변경' })).toBeVisible();
    await user.click(within(formDialog).getByRole('button', { name: '취소' }));

    await user.click(screen.getByRole('button', { name: '팀 배정 확정' }));
    const requiredDialog = await screen.findByRole('alertdialog', {
      name: '팀 배정 확정 확인',
    });
    await user.click(requiredDialog);
    expect(
      screen.getByRole('alertdialog', { name: '팀 배정 확정 확인' }),
    ).toBeVisible();
  });

  it('수강생 제외를 확인하면 팀 접근 제한을 안내하고 목록과 팀 구성에서 제거한다', async () => {
    const user = userEvent.setup();

    renderPage();

    const studentNameButton = (
      await screen.findAllByRole('button', { name: '김민준' })
    ).find(button => button.closest('table'));
    expect(studentNameButton).toBeDefined();
    const studentRow = studentNameButton!.closest('tr') as HTMLElement;
    await user.click(
      within(studentRow).getByRole('button', { name: '김민준 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '제외' }));

    const dialog = await screen.findByRole('alertdialog', {
      name: '수강생 제외 확인',
    });
    expect(
      within(dialog).getByText(
        /김민준 학생을 이 분반에서 제외하면 팀 소속도 함께 해제되어/,
      ),
    ).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '제외 확인' }));

    await waitFor(() =>
      expect(screen.queryByText('김민준')).not.toBeInTheDocument(),
    );
    expect(screen.getAllByText('이서연')).toHaveLength(2);
  });

  it('팀 배정을 확정하면 확정 버튼을 비활성화한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '팀 배정 확정' }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: '팀 배정 확정 확인',
    });
    await user.click(within(dialog).getByRole('button', { name: '확정하기' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: '팀 배정 확정됨' }),
      ).toBeDisabled(),
    );
  });

  it('확정된 팀원 관리 메뉴에서는 역할 변경과 팀 이동을 제공하지 않는다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '팀 배정 확정' }),
    );
    const confirmation = await screen.findByRole('alertdialog', {
      name: '팀 배정 확정 확인',
    });
    await user.click(
      within(confirmation).getByRole('button', { name: '확정하기' }),
    );
    await screen.findByRole('button', { name: '팀 배정 확정됨' });
    await user.click(
      await screen.findByRole('button', { name: '이서연 관리' }),
    );

    expect(
      screen.queryByRole('button', { name: '역할 변경' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '팀 이동' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '제외' })).toBeInTheDocument();
  });

  it('팀장을 새 팀원으로 변경하면 팀 카드에 갱신된 팀장을 표시한다', async () => {
    const user = userEvent.setup();

    renderPage();

    const [firstTeamLeaderButton] = await screen.findAllByRole('button', {
      name: '팀장 변경',
    });
    if (!firstTeamLeaderButton)
      throw new Error('팀장 변경 버튼을 찾을 수 없습니다.');
    await user.click(firstTeamLeaderButton);
    const dialog = await screen.findByRole('dialog', { name: '팀장 변경' });
    await user.click(within(dialog).getByRole('radio', { name: /이서연/ }));
    await user.click(within(dialog).getByRole('button', { name: '팀장 변경' }));

    await waitFor(() =>
      expect(screen.getByText('팀장: 이서연')).toBeInTheDocument(),
    );
  });

  it('미확정 팀원의 프로젝트 역할을 표시하고 수정한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '이서연 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '역할 변경' }));

    const dialog = await screen.findByRole('dialog', {
      name: '프로젝트 역할 변경',
    });
    const roleInput = within(dialog).getByRole('textbox', {
      name: '프로젝트 역할',
    });
    await user.type(roleInput, '백엔드');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    await waitFor(() => {
      const studentList = screen
        .getByRole('heading', { name: '수강생 목록' })
        .closest('section');
      const studentRow = within(studentList!)
        .getByRole('button', { name: '이서연' })
        .closest('tr');
      const firstTeam = screen
        .getByRole('heading', { name: '1팀' })
        .closest('article');

      expect(within(studentRow!).getByText('백엔드')).toBeInTheDocument();
      expect(within(firstTeam!).getByText('역할: 백엔드')).toBeInTheDocument();
    });
  });

  it('역할 저장 중 팀이 확정되면 변경 불가 사유를 안내한다', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_MEMBER(':teamId', ':studentNumber')}`,
        () => HttpResponse.json({ code: 'TEAM_CONFIRMED' }, { status: 409 }),
      ),
    );

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '이서연 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '역할 변경' }));
    const dialog = await screen.findByRole('dialog', {
      name: '프로젝트 역할 변경',
    });
    await user.type(
      within(dialog).getByRole('textbox', { name: '프로젝트 역할' }),
      '기획',
    );
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(
      await within(dialog).findByText(
        '팀 배정이 확정되어 역할을 변경할 수 없습니다.',
      ),
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByRole('textbox', { name: '프로젝트 역할' }),
      ' 수정',
    );
    expect(
      within(dialog).queryByText(
        '팀 배정이 확정되어 역할을 변경할 수 없습니다.',
      ),
    ).not.toBeInTheDocument();
  });

  it('50자를 초과한 역할과 팀 이동을 함께 요청해도 기존 팀 소속을 유지한다', async () => {
    renderPage();

    await screen.findByRole('button', { name: '김민준 관리' });

    await expect(
      updateAdminTeamMember(1, '20231234', {
        projectRole: '역'.repeat(51),
        targetTeamId: 2,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } });

    const [sourceTeam, targetTeam] = await Promise.all([
      fetchAdminTeam(1),
      fetchAdminTeam(2),
    ]);

    expect(
      sourceTeam.members.some(member => member.studentNumber === '20231234'),
    ).toBe(true);
    expect(
      targetTeam.members.some(member => member.studentNumber === '20231234'),
    ).toBe(false);
  });

  it('미확정 팀의 팀원을 같은 분반의 다른 팀으로 이동한다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '이서연 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '팀 이동' }));
    const dialog = await screen.findByRole('dialog', { name: '팀원 이동' });
    await user.click(within(dialog).getByRole('radio', { name: /2팀/ }));
    await user.click(within(dialog).getByRole('button', { name: '이동하기' }));

    await waitFor(() => {
      const studentList = screen
        .getByRole('heading', { name: '수강생 목록' })
        .closest('section');
      const firstTeam = screen
        .getByRole('heading', { name: '1팀' })
        .closest('article');
      const secondTeam = screen
        .getByRole('heading', { name: '2팀' })
        .closest('article');
      const movedStudentRow = within(studentList!)
        .getByRole('button', { name: '이서연' })
        .closest('tr');

      expect(within(firstTeam!).queryByText('이서연')).not.toBeInTheDocument();
      expect(within(secondTeam!).getByText('이서연')).toBeInTheDocument();
      expect(within(movedStudentRow!).getByText('2팀')).toBeInTheDocument();
    });
  });

  it('팀장을 이동하면 역할 해제 안내를 표시하고 대상 팀으로 옮긴다', async () => {
    const user = userEvent.setup();

    renderPage();

    await user.click(
      await screen.findByRole('button', { name: '김민준 관리' }),
    );
    await user.click(await screen.findByRole('button', { name: '팀 이동' }));

    const dialog = await screen.findByRole('dialog', { name: '팀원 이동' });
    expect(
      within(dialog).getByText(
        '현재 팀에서 팀장으로 설정되어 있다면 팀장 역할을 해제하고 이동합니다.',
      ),
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('radio', { name: /2팀/ }));
    await user.click(within(dialog).getByRole('button', { name: '이동하기' }));

    await waitFor(() => {
      const firstTeam = screen
        .getByRole('heading', { name: '1팀' })
        .closest('article');
      const secondTeam = screen
        .getByRole('heading', { name: '2팀' })
        .closest('article');
      expect(within(firstTeam!).queryByText('김민준')).not.toBeInTheDocument();
      expect(within(firstTeam!).getByText('팀장: 미지정')).toBeInTheDocument();
      expect(within(secondTeam!).getByText('팀장: 박지훈')).toBeInTheDocument();
      expect(
        within(secondTeam!).queryByText('팀장: 김민준'),
      ).not.toBeInTheDocument();
    });
  });

  it('팀 구성 카드에서 다른 미확정 팀으로 끌어 놓으면 이동 확인 창을 연다', async () => {
    const user = userEvent.setup();
    const dataTransfer = {
      dropEffect: '',
      effectAllowed: '',
      setData: () => undefined,
    };

    renderPage();

    const firstTeam = (
      await screen.findByRole('heading', {
        name: '1팀',
      })
    ).closest('article');
    const secondTeam = screen
      .getByRole('heading', { name: '2팀' })
      .closest('article');
    const memberCard = within(firstTeam!)
      .getByRole('button', { name: '이서연' })
      .closest('li');

    fireEvent.dragStart(memberCard!, { dataTransfer });
    fireEvent.dragOver(secondTeam!, { dataTransfer });
    fireEvent.drop(secondTeam!, { dataTransfer });

    const dialog = await screen.findByRole('dialog', { name: '팀원 이동' });
    expect(within(dialog).getByRole('radio', { name: /2팀/ })).toBeChecked();

    await user.click(within(dialog).getByRole('button', { name: '이동하기' }));

    await waitFor(() =>
      expect(within(secondTeam!).getByText('이서연')).toBeInTheDocument(),
    );
  });

  it('목록을 기다리는 동안 로딩 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(':sectionId')}`,
        async () => {
          await delay(1_000);
          return HttpResponse.json({ contents: [] });
        },
      ),
    );

    renderPage();

    expect(
      await screen.findByText('수강생과 팀 목록을 불러오는 중입니다.'),
    ).toBeInTheDocument();
  });

  it('수강생 목록이 비어 있으면 빈 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(':sectionId')}`,
        () => HttpResponse.json({ contents: [] }),
      ),
    );

    renderPage();

    expect(
      await screen.findByText('이 분반에 등록된 수강생이 없습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'OOP-01 팀 구성' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '1팀' })).toBeInTheDocument();
  });

  it('목록 요청이 실패하면 오류 상태를 표시한다', async () => {
    server.use(
      http.get(
        `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_ENROLLMENTS(':sectionId')}`,
        () =>
          HttpResponse.json(
            {
              code: 'STUDENT_LOOKUP_FAILED',
              message: '목록을 불러오지 못했습니다.',
            },
            { status: 500 },
          ),
      ),
    );

    renderPage();

    await waitFor(() =>
      expect(
        screen.getByText(
          '목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
        ),
      ).toBeInTheDocument(),
    );
  });
});
