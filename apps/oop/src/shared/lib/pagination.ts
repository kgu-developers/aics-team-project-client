/** Every admin list shows this many rows per page (server- or client-paged). */
export const LIST_PAGE_SIZE = 10;

export function getPageCount(totalItems: number, pageSize = LIST_PAGE_SIZE) {
  return Math.max(0, Math.ceil(totalItems / pageSize));
}

/** Clamps a 0-based page into range; an empty list is page 0. */
export function clampPage(page: number, pageCount: number) {
  if (!Number.isInteger(page) || page < 0) return 0;
  return Math.min(page, Math.max(0, pageCount - 1));
}

/** Slices a client-side list for a 0-based page. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize = LIST_PAGE_SIZE,
) {
  const pageCount = getPageCount(items.length, pageSize);
  const currentPage = clampPage(page, pageCount);
  return {
    items: items.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    page: currentPage,
    pageCount,
  };
}
