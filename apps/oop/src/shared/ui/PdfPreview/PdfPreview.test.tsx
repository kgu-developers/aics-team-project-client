import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PdfPreview } from './PdfPreview';

const firstUrl = 'https://files.example.test/slides.pdf?expires=1';
const refreshedUrl = 'https://files.example.test/slides.pdf?expires=2';

function preview(url: string, onReload?: () => void, fileKey = 'file-19') {
  return (
    <AstryxThemeProvider>
      <PdfPreview
        fileKey={fileKey}
        onReload={onReload}
        title='발표자료.pdf'
        url={url}
      />
    </AstryxThemeProvider>
  );
}

function renderPreview(onReload?: () => void) {
  return render(preview(firstUrl, onReload));
}

describe('PdfPreview', () => {
  it('브라우저 내장 뷰어로 PDF를 embed하고 실패 시 안내를 남긴다', () => {
    const { container } = renderPreview();
    const embed = container.querySelector('object');

    expect(
      screen.getByRole('region', { name: '발표자료.pdf 미리보기' }),
    ).toBeInTheDocument();
    expect(embed).toHaveAttribute('data', firstUrl);
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

  it('서명만 갱신되면 보던 문서를 그대로 유지한다', () => {
    const onReload = vi.fn();
    const { container, rerender } = render(preview(firstUrl, onReload));

    rerender(preview(refreshedUrl, onReload));

    expect(container.querySelector('object')).toHaveAttribute('data', firstUrl);
  });

  it('새로 고침을 요청한 뒤 받은 주소로 교체한다', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    const { container, rerender } = render(preview(firstUrl, onReload));

    await user.click(
      screen.getByRole('button', { name: '미리보기 새로 고침' }),
    );
    rerender(preview(refreshedUrl, onReload));

    expect(onReload).toHaveBeenCalledTimes(1);
    expect(container.querySelector('object')).toHaveAttribute(
      'data',
      refreshedUrl,
    );
  });

  it('다른 파일로 바뀌면 바로 교체한다', () => {
    const { container, rerender } = render(preview(firstUrl));

    rerender(preview(refreshedUrl, undefined, 'file-20'));

    expect(container.querySelector('object')).toHaveAttribute(
      'data',
      refreshedUrl,
    );
  });
});
