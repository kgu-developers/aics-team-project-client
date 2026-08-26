import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  alignSelf: 'center',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  marginInline: 'auto',
  minHeight: 0,
  width: 'min(100%, 364px)',
});

export const flowBody = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: tokens.spacing['6'],
  minHeight: 0,
  width: '100%',
});

export const stepper = style({
  alignItems: 'flex-start',
  display: 'flex',
  gap: tokens.spacing['5'],
  justifyContent: 'center',
  width: '100%',
});

export const content = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: tokens.spacing['5'],
  minHeight: 0,
  padding: `${tokens.spacing['2']} 0 ${tokens.spacing['6']}`,
});

export const centeredContent = style({ justifyContent: 'center' });

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
  marginTop: 'auto',
});

export const centeredActions = style({
  alignSelf: 'center',
  justifyContent: 'center',
  marginTop: 0,
  width: '100%',
});

export const question = style({
  display: 'grid',
  gap: tokens.spacing['5'],
});

export const questionCopy = style({
  display: 'grid',
  gap: tokens.spacing['2'],
});

export const questionTitle = style({
  margin: 0,
});

export const questionDescription = style({
  margin: 0,
});

export const fields = style({
  display: 'grid',
  gap: tokens.spacing['6'],
});
