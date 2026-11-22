import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const header = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const visuallyHidden = style({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
});

export const teamList = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

const teamRow = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  padding: '12px 4px',
  width: '100%',
  '@media': {
    'screen and (max-width: 640px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

export const teamLink = style([
  teamRow,
  {
    color: tokens.color.text.primary,
    textDecoration: 'none',
    ':focus-visible': {
      background: tokens.color.background.muted,
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
    ':hover': {
      background: tokens.color.background.muted,
    },
  },
]);

export const teamMain = style({
  alignItems: 'center',
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '106px minmax(0, 1fr)',
  minWidth: 0,
});

export const teamName = style({
  fontSize: 14,
  fontWeight: 600,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '@media': {
    '(max-width: 560px)': {
      overflow: 'visible',
      overflowWrap: 'anywhere',
      whiteSpace: 'normal',
    },
  },
});

export const teamStatus = style({
  alignItems: 'center',
  display: 'inline-flex',
  gap: 6,
  fontSize: 12,
  whiteSpace: 'nowrap',
});

export const teamLinkAction = style({
  alignItems: 'center',
  color: tokens.color.text.primary,
  display: 'inline-flex',
  fontSize: 13,
  fontWeight: 500,
  gap: 16,
  whiteSpace: 'nowrap',
  '@media': {
    'screen and (max-width: 640px)': {
      justifySelf: 'end',
    },
  },
});

export const teamOrder = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  fontWeight: 400,
  minWidth: 64,
  textAlign: 'right',
});
