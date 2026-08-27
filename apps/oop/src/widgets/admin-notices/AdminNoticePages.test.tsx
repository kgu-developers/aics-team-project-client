import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DeleteNoticeDialog } from './AdminNoticePages';

import { adminNoticeDetails, adminNotices } from '~/mocks/data/adminNotices';

const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
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

afterAll(() => {
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

function NoticeDialogTestHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} type='button'>
        삭제
      </button>
      <DeleteNoticeDialog
        detail={{ ...adminNoticeDetails['1'], notice: adminNotices[0] }}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function renderDialog() {
  return render(
    <AstryxThemeProvider>
      <NoticeDialogTestHarness />
    </AstryxThemeProvider>,
  );
}

describe('AdminNoticeDetailPage 삭제 모달', () => {
  it('삭제 버튼으로 모달을 열고 공지 내용을 표시한 뒤 취소할 수 있다', async () => {
    const user = userEvent.setup();

    renderDialog();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);

    const dialog = await screen.findByRole('dialog', {
      name: '공지사항 삭제 확인',
    });
    expect(
      within(dialog).getByRole('heading', {
        name: '이 공지사항을 삭제할까요?',
      }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('전체 접수 공지')).toBeInTheDocument();
    expect(
      within(dialog).getByText('분반별 제출 일정과 공지사항을 확인해 주세요.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: '취소' }));

    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(deleteButton).toHaveFocus();
  });

  it('Escape로 삭제 모달을 닫고 원래 삭제 버튼으로 포커스를 돌려준다', async () => {
    const user = userEvent.setup();

    renderDialog();
    const deleteButton = screen.getByRole('button', { name: '삭제' });
    await user.click(deleteButton);
    const dialog = await screen.findByRole('dialog', {
      name: '공지사항 삭제 확인',
    });

    await user.keyboard('{Escape}');

    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(deleteButton).toHaveFocus();
  });
});
