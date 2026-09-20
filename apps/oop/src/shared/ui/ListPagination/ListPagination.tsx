import { Pagination } from '@aics/design-system';

import * as styles from './ListPagination.css';

type ListPaginationProps = {
  isDisabled?: boolean;
  label: string;
  onPageChange: (page: number) => void;
  /** 0-based, as the API and list state use. */
  page: number;
  pageCount: number;
};

/**
 * The one pagination bar for list screens. It speaks 0-based pages like the
 * API and list state, converts to the design system's 1-based control, and
 * disappears when there is nothing to page through.
 */
export default function ListPagination({
  isDisabled = false,
  label,
  onPageChange,
  page,
  pageCount,
}: ListPaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <div className={styles.root}>
      <Pagination
        isDisabled={isDisabled}
        label={label}
        onChange={nextPage => onPageChange(nextPage - 1)}
        page={page + 1}
        totalPages={pageCount}
        variant='compact'
      />
    </div>
  );
}
