import { style } from '@vanilla-extract/css';

export const layout = style({
  display: 'grid',
  gap: 'var(--spacing-6)',
  gridTemplateColumns: 'minmax(0, 1fr)',
  '@media': {
    'screen and (min-width: 1024px)': {
      gridTemplateColumns: '240px minmax(0, 1fr)',
    },
  },
});
export const sidebar = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
  alignContent: 'start',
});
export const sidebarTitle = style({
  margin: 0,
});
export const mobileSections = style({
  '@media': {
    'screen and (min-width: 1024px)': { display: 'none' },
  },
});
export const desktopSections = style({
  display: 'none',
  gap: 'var(--spacing-2)',
  '@media': {
    'screen and (min-width: 1024px)': { display: 'grid' },
  },
});
export const sectionLink = style({
  alignItems: 'center',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  gap: 'var(--spacing-2)',
  justifyContent: 'space-between',
  padding: 'var(--spacing-2) var(--spacing-3)',
  textDecoration: 'none',
});
export const activeSectionLink = style({
  background: 'var(--color-background-muted)',
  color: 'var(--color-text-primary)',
});
export const homeLink = style({
  color: 'var(--color-text-secondary)',
  padding: 'var(--spacing-2) var(--spacing-3)',
});
export const document = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  minWidth: 0,
});
export const header = style({
  display: 'grid',
  gap: 'var(--spacing-1)',
});
