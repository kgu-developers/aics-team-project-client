import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const panel = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 12,
  bottom: 24,
  boxShadow: '0 12px 32px rgb(10 19 23 / 18%)',
  maxWidth: 'calc(100vw - 32px)',
  overflowY: 'auto',
  position: 'fixed',
  right: 24,
  top: 88,
  width: 400,
  zIndex: 20,
  '@media': {
    'screen and (max-width: 640px)': {
      bottom: 16,
      right: 16,
      top: 72,
      width: 'calc(100vw - 32px)',
    },
  },
});

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[5],
  padding: tokens.spacing[5],
});

export const panelHeader = style({
  alignItems: 'center',
  cursor: 'grab',
  display: 'flex',
  justifyContent: 'space-between',
  selectors: {
    '&:active': { cursor: 'grabbing' },
  },
});

export const actions = style({
  display: 'flex',
  gap: tokens.spacing[2],
  justifyContent: 'flex-end',
});

export const recipientSelectors = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
});
