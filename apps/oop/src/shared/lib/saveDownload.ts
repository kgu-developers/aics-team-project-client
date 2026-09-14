export function saveDownload(file: Blob, fileName: string) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.download = fileName;
  link.href = url;
  try {
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
