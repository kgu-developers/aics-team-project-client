import { globalStyle, style } from '@vanilla-extract/css';

export const content = style({
  color: 'var(--color-text-primary)',
  lineHeight: 1.7,
  minHeight: 80,
  overflowWrap: 'anywhere',
});
globalStyle(`${content} h2`, {
  fontSize: 'var(--font-size-lg)',
  margin: '0 0 var(--spacing-3)',
});
globalStyle(`${content} p`, { margin: '0 0 var(--spacing-3)' });
globalStyle(`${content} ul, ${content} ol`, {
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-5)',
});
globalStyle(`${content} ul`, { listStyleType: 'disc' });
globalStyle(`${content} ol`, { listStyleType: 'decimal' });
globalStyle(`${content} blockquote`, {
  borderLeft: '3px solid var(--color-border-emphasized)',
  color: 'var(--color-text-secondary)',
  margin: '0 0 var(--spacing-3)',
  paddingLeft: 'var(--spacing-3)',
});
