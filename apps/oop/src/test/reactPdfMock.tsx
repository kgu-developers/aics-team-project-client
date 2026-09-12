import { type ReactNode, useEffect, useRef } from 'react';

/** jsdom에서는 pdf.js 워커를 띄울 수 없어 react-pdf 렌더링 계약만 흉내 낸다. */
export const mockPdfPageCount = 3;

/** 주소에 이 조각이 들어가면 CORS 차단처럼 로드 실패를 알린다. */
export const blockedPdfUrlMarker = 'blocked';

export function Document({
  children,
  error,
  file,
  onLoadError,
  onLoadSuccess,
}: {
  children?: ReactNode;
  error?: ReactNode;
  file: string;
  onLoadError?: (error: Error) => void;
  onLoadSuccess?: (pdf: { numPages: number }) => void;
}) {
  const notified = useRef(false);
  useEffect(() => {
    if (notified.current) return;
    notified.current = true;
    if (file.includes(blockedPdfUrlMarker))
      onLoadError?.(new Error('Failed to fetch'));
    else onLoadSuccess?.({ numPages: mockPdfPageCount });
  }, [file, onLoadError, onLoadSuccess]);

  return file ? <div data-file={file}>{children}</div> : <div>{error}</div>;
}

export function Page({ pageNumber }: { pageNumber: number }) {
  return <div>{`발표 자료 ${pageNumber}쪽`}</div>;
}

export const pdfjs = { GlobalWorkerOptions: { workerSrc: '' } };
