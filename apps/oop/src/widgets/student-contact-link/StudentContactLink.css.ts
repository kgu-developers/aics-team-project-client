import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const contact = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: 36,
});

export const link = style({
  background: 'transparent',
  color: tokens.color.text.secondary,
  minHeight: 32,
  paddingInline: tokens.spacing['2'],
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

globalStyle(`${link}:hover`, {
  color: tokens.color.text.primary,
});

export const disabledLink = style({
  paddingInline: tokens.spacing['2'],
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});
