import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const history = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
});

export const feedbackThread = style({
  background: tokens.color.background.body,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  maxHeight: 360,
  minHeight: 160,
  overflowY: 'auto',
  padding: tokens.spacing['4'],
});

export const feedbackMessage = style({
  alignSelf: 'flex-start',
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  maxWidth: '78%',
  minWidth: 0,
  padding: tokens.spacing['4'],
  '@media': {
    'screen and (max-width: 640px)': { maxWidth: '100%' },
  },
});

export const feedbackOwnMessage = style({
  alignSelf: 'flex-end',
});

export const feedbackMessageMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
});

export const feedbackMessageContent = style({
  fontSize: 15,
  lineHeight: 1.6,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

export const pagination = style({
  alignItems: 'center',
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
});

export const feedbackComposer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const feedbackSubmitAction = style({
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
});
