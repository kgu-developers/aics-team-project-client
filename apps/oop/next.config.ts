import { createVanillaExtractPlugin } from '@vanilla-extract/next-plugin';
import type { NextConfig } from 'next';

const withVanillaExtract = createVanillaExtractPlugin({
  identifiers: ({ hash }) => `_${hash}`,
});

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@aics/api-client',
    '@aics/core',
    '@aics/team-project-kit',
    '@aics/ui',
  ],
};

export default withVanillaExtract(nextConfig);
