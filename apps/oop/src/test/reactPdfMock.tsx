import { type ReactNode, useEffect, useRef } from 'react';

/** jsdom에서는 pdf.js 워커를 띄울 수 없어 react-pdf 렌더링 계약만 흉내 낸다. */
export const mockPdfPageCount = 3;

export function Document({
  children,
  error,
  file,
  onLoadSuccess,
}: {
  children?: ReactNode;
  error?: ReactNode;
  file: string;
  onLoadSuccess?: (pdf: { numPages: number }) => void;
}) {
  const notified = useRef(false);
  useEffect(() => {
    if (notified.current) return;
    notified.current = true;
    onLoadSuccess?.({ numPages: mockPdfPageCount });
  }, [onLoadSuccess]);

  return file ? <div data-file={file}>{children}</div> : <div>{error}</div>;
}

export function Page({ pageNumber }: { pageNumber: number }) {
  return <div>{`발표 자료 ${pageNumber}쪽`}</div>;
}

export const pdfjs = { GlobalWorkerOptions: { workerSrc: '' } };
