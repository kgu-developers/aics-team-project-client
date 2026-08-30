import { style } from '@vanilla-extract/css';

export const layout = style({
  display: 'grid',
  gap: 'var(--spacing-6)',
  gridTemplateColumns: '220px minmax(0, 1fr)',
  maxWidth: '1180px',
  margin: '0 auto',
  padding: 'var(--spacing-6)',
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: 0,
    },
  },
});
export const sidebar = style({
  display: 'grid',
  alignContent: 'start',
  gap: 'var(--spacing-2)',
  '@media': {
    'screen and (max-width: 767px)': {
      paddingInline: 'var(--spacing-4)',
    },
  },
});
export const sidebarTitle = style({ margin: 0 });
export const desktopSections = style({
  display: 'grid',
  gap: 'var(--spacing-2)',
  '@media': { 'screen and (max-width: 767px)': { display: 'none' } },
});
export const mobileSelector = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 767px)': { display: 'block', minWidth: 0 },
  },
});
export const sectionLink = style({
  alignItems: 'center',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-3)',
  textDecoration: 'none',
});
export const activeSectionLink = style({
  background: 'var(--color-background-muted)',
  color: 'var(--color-text-primary)',
  fontWeight: 600,
});
export const document = style({
  background: 'var(--color-background-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  display: 'grid',
  gap: 'var(--spacing-5)',
  minWidth: 0,
  padding: 'var(--spacing-6)',
  '@media': {
    'screen and (max-width: 767px)': {
      borderInline: 0,
      borderRadius: 0,
      padding: 'var(--spacing-4)',
    },
  },
});
export const metadata = style({
  color: 'var(--color-text-secondary)',
  display: 'flex',
  fontSize: 'var(--font-size-sm)',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
});
export const title = style({ margin: 0, overflowWrap: 'anywhere' });
export const description = style({
  color: 'var(--color-text-secondary)',
  margin: 0,
  overflowWrap: 'anywhere',
});
export const form = style({
  display: 'grid',
  gap: 'var(--spacing-5)',
  minWidth: 0,
});
export const fieldGrid = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  gridTemplateColumns: 'minmax(0, 1fr)',
});
export const lockNotice = style({
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  margin: 0,
  padding: 'var(--spacing-3)',
});
export const actions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
});
export const actionError = style({
  color: 'var(--color-text-error)',
  flexBasis: '100%',
  fontSize: 'var(--font-size-sm)',
  margin: 0,
});
export const deferred = style({
  color: 'var(--color-text-secondary)',
  fontSize: 'var(--font-size-sm)',
  margin: 0,
});
