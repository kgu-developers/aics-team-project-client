import { defineTheme } from '@astryxdesign/core/theme';

/**
 * OOP's Figma `03` collection uses the Astryx core semantic token contract.
 *
 * `Light.tokens.json` and `Dark.tokens.json` correspond to Astryx's
 * light-dark token pairs, so their color, spacing, radius, motion, and type
 * scale values stay in Astryx rather than being copied into this package.
 * The approved OOP font-family decisions are the only non-default foundation
 * values here. Font delivery is intentionally owned by the consuming
 * app/deployment (see packages/design-system/AGENTS.md).
 */
export const oopTheme = defineTheme({
  name: 'oop',
  typography: {
    body: {
      family: 'IBM Plex Sans KR',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'IBM Plex Sans KR',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    code: {
      family: 'Roboto Mono',
      fallbacks: '"SF Mono", Monaco, Consolas, monospace',
    },
  },
});
