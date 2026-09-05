import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[3],
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const item = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: tokens.spacing[3],
  gridTemplateColumns: '40px minmax(0, 1fr) auto',
  minHeight: 64,
  padding: `${tokens.spacing[2]} 0`,
  selectors: {
    '&:first-child': {
      borderTop: `1px solid ${tokens.color.border.base}`,
    },
  },
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: '40px minmax(0, 1fr)',
    },
  },
});

export const extension = style({
  alignItems: 'center',
  background: tokens.color.background.blue,
  borderRadius: tokens.radius.element,
  color: tokens.color.text.accent,
  display: 'flex',
  fontSize: tokens['font-size'].xs,
  fontWeight: tokens['font-weight'].semibold,
  height: 40,
  justifyContent: 'center',
  width: 40,
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['0-5'],
  minWidth: 0,
});

export const label = style({
  color: tokens.color.text.secondary,
  fontSize: tokens['font-size'].sm,
  fontWeight: tokens['font-weight'].medium,
  lineHeight: 1.5,
});

export const value = style({
  color: tokens.color.text.primary,
  fontSize: tokens['font-size'].sm,
  lineHeight: 1.5,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const emptyValue = style({
  color: tokens.color.text.disabled,
  fontSize: tokens['font-size'].sm,
  lineHeight: 1.5,
});

export const action = style({
  justifySelf: 'end',
  '@media': {
    'screen and (max-width: 767px)': {
      gridColumn: 2,
      justifySelf: 'start',
    },
  },
});

export const metadata = style({
  maxWidth: 560,
});

globalStyle(`${metadata} dt, ${metadata} dd`, {
  fontSize: tokens['font-size'].sm,
  lineHeight: 'var(--text-supporting-leading)',
  minHeight: 20,
});
