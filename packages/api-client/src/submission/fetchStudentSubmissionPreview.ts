/** Signed file URLs must not inherit the API client's cookies or auth headers. */
export async function fetchStudentSubmissionPreview(
  url: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw new Error('파일 주소를 확인할 수 없습니다.');
  const response = await fetch(url, {
    credentials: 'omit',
    redirect: 'error',
    signal,
  });
  if (!response.ok) throw new Error('파일 미리보기를 불러올 수 없습니다.');
  const blob = await response.blob();
  if (blob.type.split(';')[0] !== 'application/pdf')
    throw new Error('PDF 파일 응답을 확인할 수 없습니다.');
  return blob;
}
