import { defineTheme } from '@astryxdesign/core/theme';

/**
 * OOP's Figma `03` collection uses the Astryx core semantic token contract.
 *
 * `Light.tokens.json` and `Dark.tokens.json` correspond to Astryx's
 * light-dark token pairs, so their color, spacing, radius, motion, and type
 * scale values stay in Astryx rather than being copied into this package.
 * The only non-default foundation values are the Figma font family choices.
 * Font delivery is intentionally owned by the consuming app/deployment.
 */
export const oopTheme = defineTheme({
  name: 'oop',
  typography: {
    body: {
      family: 'Inter',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    heading: {
      family: 'Inter',
      fallbacks:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    code: {
      family: 'Roboto Mono',
      fallbacks: '"SF Mono", Monaco, Consolas, monospace',
    },
  },
});
