import { style } from '@vanilla-extract/css';

export const root = style({
  alignItems: 'center',
  background: 'var(--color-background-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  gap: 'var(--spacing-4)',
  marginBottom: 'var(--spacing-6)',
  padding: 'var(--spacing-4)',
  '@media': {
    '(max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
});

export const label = style({
  color: 'var(--color-text-secondary)',
  flex: '0 0 auto',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 'var(--font-weight-medium)',
  margin: 0,
});

export const options = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
