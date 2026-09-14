import { Buffer } from 'node:buffer';

export function pdfFile() {
  // A real one-page PDF, generated in memory without private or binary fixtures.
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let source = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(source));
    source += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map(offset => String(offset).padStart(10, '0') + ' 00000 n ')
    .join(
      '\n',
    )}\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return {
    name: 'e2e-submission.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(source),
  };
}
