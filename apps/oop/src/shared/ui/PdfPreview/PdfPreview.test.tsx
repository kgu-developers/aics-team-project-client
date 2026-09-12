import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PdfPreview } from './PdfPreview';

vi.mock('react-pdf', () => import('~/test/reactPdfMock'));

function renderPreview(url = 'https://example.com/slides.pdf') {
  return render(
    <AstryxThemeProvider>
      <PdfPreview title='발표자료.pdf' url={url} />
    </AstryxThemeProvider>,
  );
}

describe('PdfPreview', () => {
  it('문서를 불러오면 첫 쪽과 전체 쪽수를 보여 준다', async () => {
    renderPreview();

    expect(
      await screen.findByRole('region', { name: '발표자료.pdf 미리보기' }),
    ).toBeInTheDocument();
    expect(screen.getByText('발표 자료 1쪽')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이전 쪽' })).toBeDisabled();
  });

  it('쪽 이동 버튼으로 마지막 쪽까지 넘기고 경계에서 멈춘다', async () => {
    const user = userEvent.setup();
    renderPreview();

    await screen.findByText('발표 자료 1쪽');
    await user.click(screen.getByRole('button', { name: '다음 쪽' }));
    expect(screen.getByText('발표 자료 2쪽')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음 쪽' }));
    expect(screen.getByText('발표 자료 3쪽')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다음 쪽' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '이전 쪽' }));
    expect(screen.getByText('발표 자료 2쪽')).toBeInTheDocument();
  });

  it('확대 단계의 양 끝에서 해당 버튼을 잠근다', async () => {
    const user = userEvent.setup();
    renderPreview();

    await screen.findByText('발표 자료 1쪽');
    expect(screen.getByRole('button', { name: '축소' })).toBeDisabled();

    for (let step = 0; step < 3; step += 1)
      await user.click(screen.getByRole('button', { name: '확대' }));

    expect(screen.getByRole('button', { name: '확대' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '축소' })).not.toBeDisabled();
  });

  it('문서를 읽지 못하면 브라우저 내장 뷰어로 내려간다', async () => {
    const { container } = renderPreview('https://example.com/blocked.pdf');

    await screen.findByRole('region', { name: '발표자료.pdf 미리보기' });
    const embed = container.querySelector('object');
    expect(embed).toHaveAttribute('data', 'https://example.com/blocked.pdf');
    expect(embed).toHaveAttribute('type', 'application/pdf');
    expect(
      screen.queryByRole('button', { name: '다음 쪽' }),
    ).not.toBeInTheDocument();
  });
});
