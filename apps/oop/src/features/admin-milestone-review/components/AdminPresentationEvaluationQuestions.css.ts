import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'grid',
  gap: tokens.spacing['3'],
  minWidth: 0,
});

export const sectionList = style({
  display: 'grid',
  gap: tokens.spacing['2'],
});

export const sectionCard = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'grid',
  gap: tokens.spacing['3'],
  minWidth: 0,
  padding: tokens.spacing['3'],
});

export const sectionTitle = style({
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
});

export const description = style({ margin: 0 });

export const criteriaList = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  margin: 0,
  paddingLeft: tokens.spacing['5'],
});
