import { setApiAccessToken } from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';

import { useDownloadAdminSubmissionArtifactsMutation } from './useDownloadAdminSubmissionArtifactsMutation';

const { downloadAdminSubmissionArtifactsMock } = vi.hoisted(() => ({
  downloadAdminSubmissionArtifactsMock: vi.fn(),
}));

vi.mock('@aics/api-client', async importOriginal => {
  const actual = await importOriginal<typeof import('@aics/api-client')>();

  return {
    ...actual,
    downloadAdminSubmissionArtifacts: downloadAdminSubmissionArtifactsMock,
  };
});

const client = new QueryClient({
  defaultOptions: { mutations: { retry: false } },
});
afterEach(() => {
  client.clear();
  setApiAccessToken(null);
  vi.restoreAllMocks();
});
function Download() {
  const download = useDownloadAdminSubmissionArtifactsMutation();
  return (
    <button disabled={download.isPending} onClick={() => download.mutate('7')}>
      ZIP 다운로드
    </button>
  );
}
it.each([200, 500])(
  'handles ZIP HTTP %s with connected download or visible error',
  async status => {
    downloadAdminSubmissionArtifactsMock.mockImplementation(() => {
      if (status === 500) return Promise.reject(new Error('DOWNLOAD_FAILED'));

      return Promise.resolve({
        file: new Blob(['archive'], { type: 'application/zip' }),
        fileName: 'files.zip',
      });
    });
    const create = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:download');
    const revoke = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.isConnected).toBe(true);
        expect(this.download).toBe('files.zip');
      });
    // jsdom has no native showPopover; exercise the real toast in its supported inline mode.
    render(
      <AstryxThemeProvider>
        <QueryClientProvider client={client}>
          <ToastViewport isTopLayer={false}>
            <Download />
          </ToastViewport>
        </QueryClientProvider>
      </AstryxThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'ZIP 다운로드' }));
    if (status === 500) {
      await waitFor(() =>
        expect(
          screen.getByText(
            '제출 파일을 다운로드하지 못했습니다. 다시 시도해 주세요.',
          ),
        ).toBeVisible(),
      );
      expect(create).not.toHaveBeenCalled();
      expect(click).not.toHaveBeenCalled();
    } else {
      await waitFor(() => expect(click).toHaveBeenCalledOnce());
      expect(document.querySelector('a[download="files.zip"]')).toBeNull();
      expect(revoke).toHaveBeenCalledWith('blob:download');
    }
  },
);
