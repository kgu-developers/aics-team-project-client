import { style } from '@vanilla-extract/css';
export const layout = style({
  display: 'grid',
  gridTemplateColumns: '220px minmax(0,1fr)',
  gap: 'var(--spacing-6)',
  maxWidth: '1180px',
  margin: '0 auto',
  padding: 'var(--spacing-6)',
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: 'minmax(0,1fr)',
      padding: 'var(--spacing-4)',
    },
  },
});
export const navigation = style({
  display: 'grid',
  alignContent: 'start',
  gap: 'var(--spacing-3)',
});
export const link = style({
  display: 'flex',
  justifyContent: 'space-between',
  gap: 'var(--spacing-2)',
  padding: 'var(--spacing-3)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-primary)',
  textDecoration: 'none',
  selectors: {
    '&[aria-current="page"]': { background: 'var(--color-background-muted)' },
  },
});
export const document = style({
  minWidth: 0,
  display: 'grid',
  alignContent: 'start',
  gap: 'var(--spacing-5)',
  padding: 'var(--spacing-6)',
  background: 'var(--color-background-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
});
export const notice = style({
  margin: 0,
  padding: 'var(--spacing-3)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-background-muted)',
  color: 'var(--color-text-secondary)',
});
export const error = style({ color: 'var(--color-text-error)', margin: 0 });

export const desktopSections = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
  '@media': { 'screen and (max-width: 767px)': { display: 'none' } },
});
export const mobileSections = style({
  display: 'none',
  '@media': { 'screen and (max-width: 767px)': { display: 'block' } },
});
