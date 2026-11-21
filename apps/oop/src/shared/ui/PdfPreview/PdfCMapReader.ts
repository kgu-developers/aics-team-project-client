// Resolve only assets bundled from the same PDF.js version as the worker.
const cMaps = import.meta.glob<string>(
  '/node_modules/pdfjs-dist/cmaps/*.bcmap',
  {
    eager: true,
    import: 'default',
    query: '?url&no-inline',
  },
);

export class PdfCMapReader {
  async fetch({ name }: { name: string }) {
    const url = cMaps[`/node_modules/pdfjs-dist/cmaps/${name}.bcmap`];
    if (!url) throw new Error('Unsupported PDF CMap');
    const response = await fetch(url);
    if (!response.ok) throw new Error('Could not load PDF CMap');
    return {
      cMapData: new Uint8Array(await response.arrayBuffer()),
      isCompressed: true,
    };
  }
}
