import { AstryxThemeProvider } from '@aics/design-system';
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AdminShell from './AdminShell';

function renderShell() {
  const rootRoute = createRootRoute();
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ['/admin'] }),
    routeTree: rootRoute,
  });

  return render(
    <AstryxThemeProvider>
      <RouterContextProvider router={router}>
        <AdminShell />
      </RouterContextProvider>
    </AstryxThemeProvider>,
  );
}

describe('AdminShell', () => {
  it('푸터에 학생 화면과 같은 문의 링크와 카피라이트를 표시한다', () => {
    renderShell();

    const logo = screen.getByRole('img', { name: '경기대학교' });
    const contact = screen.getByRole('link', { name: '문의하기' });
    const copyright = screen.getByText(
      '© 2026 KGU Developers CSHOME. All rights reserved.',
    );

    expect(logo.compareDocumentPosition(contact)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(contact.compareDocumentPosition(copyright)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
