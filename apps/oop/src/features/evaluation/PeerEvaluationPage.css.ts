import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100dvh - 9rem)',
  width: '100%',
  '@media': {
    'screen and (max-width: 540px)': {
      minHeight: 0,
    },
  },
});

export const stableSurface = style({
  minHeight: 736,
  '@media': {
    'screen and (max-width: 540px)': {
      minHeight: 'auto',
    },
  },
});

export const form = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  width: '100%',
});

export const helper = style({
  color: tokens.color.text.secondary,
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  margin: 0,
});

export const targetList = style({
  display: 'grid',
  gap: tokens.spacing['6'],
});

export const targetItem = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: tokens.spacing['4'],
  paddingBottom: tokens.spacing['6'],
});

export const targetHeader = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});

export const targetName = style({
  color: tokens.color.text.primary,
  fontSize: '0.875rem',
  fontWeight: 600,
  margin: 0,
});

export const targetRole = style({
  color: tokens.color.text.secondary,
  fontSize: '0.8125rem',
  margin: `${tokens.spacing['1']} 0 0`,
});

export const total = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});

export const totalValue = style({
  color: tokens.color.text.primary,
  fontSize: '0.875rem',
  fontWeight: 600,
  margin: 0,
});

export const error = style({ color: tokens.color.text.red, margin: 0 });
export const status = style({ color: tokens.color.text.secondary, margin: 0 });

export const dialogContent = style({
  display: 'grid',
  gap: tokens.spacing['4'],
  gridTemplateColumns: 'minmax(0, 1fr)',
  minWidth: 0,
  width: '100%',
});

export const dialogHeader = style({
  display: 'grid',
  gap: tokens.spacing['1'],
});

export const dialogActions = style({
  flexWrap: 'wrap',
  minWidth: 0,
  width: '100%',
});
