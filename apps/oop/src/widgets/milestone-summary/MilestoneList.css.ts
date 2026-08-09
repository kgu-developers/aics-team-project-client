import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const milestoneSection = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});

export const sectionHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const sectionTitle = style({
  color: tokens.color.text.primary,
  fontSize: 24,
  fontWeight: 500,
  margin: 0,
});

export const sectionDesc = style({
  color: tokens.color.text.disabled,
  fontSize: 16,
  fontWeight: 500,
  margin: 0,
});

export const milestoneList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});
