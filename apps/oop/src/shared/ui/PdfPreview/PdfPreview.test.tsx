import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PdfPreview } from './PdfPreview';

function renderPreview(onReload?: () => void) {
  return render(
    <AstryxThemeProvider>
      <PdfPreview
        onReload={onReload}
        title='발표자료.pdf'
        url='https://files.example.test/slides.pdf?expires=1'
      />
    </AstryxThemeProvider>,
  );
}

describe('PdfPreview', () => {
  it('브라우저 내장 뷰어로 PDF를 embed하고 실패 시 안내를 남긴다', () => {
    const { container } = renderPreview();
    const embed = container.querySelector('object');

    expect(
      screen.getByRole('region', { name: '발표자료.pdf 미리보기' }),
    ).toBeInTheDocument();
    expect(embed).toHaveAttribute(
      'data',
      'https://files.example.test/slides.pdf?expires=1',
    );
    expect(embed).toHaveAttribute('type', 'application/pdf');
    expect(embed).toHaveTextContent('미리보기를 표시할 수 없어요.');
  });

  it('만료된 주소를 다시 받도록 새로 고침을 요청한다', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderPreview(onReload);

    await user.click(
      screen.getByRole('button', { name: '미리보기 새로 고침' }),
    );

    expect(onReload).toHaveBeenCalledTimes(1);
  });

  it('새로 고침 수단이 없으면 버튼을 노출하지 않는다', () => {
    renderPreview();

    expect(
      screen.queryByRole('button', { name: '미리보기 새로 고침' }),
    ).not.toBeInTheDocument();
  });
});
