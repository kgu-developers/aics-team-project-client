import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

import { layoutTokens } from '~/app/tokens.css';

export const footer = style({
  background: tokens.color.background.card,
  borderTop: `1px solid ${tokens.color.border.base}`,
  bottom: 0,
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
  left: 0,
  position: 'fixed',
  right: 0,
  zIndex: 20,
});

export const footerWithAdminSidebar = style({
  left: layoutTokens.workspace['sidebar-width'],
  '@media': {
    '(max-width: 900px)': { left: 0 },
  },
});

export const card = style({
  borderRadius: 0,
  boxSizing: 'border-box',
  display: 'block',
  marginInline: 'auto',
  maxWidth: 1120,
  width: '100%',
});

export const navigation = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
});

export const status = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
  minWidth: 0,
  overflow: 'hidden',
  textAlign: 'center',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 560px)': { fontSize: 12 },
  },
});
