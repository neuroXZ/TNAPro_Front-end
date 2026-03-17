import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Allow cross-origin requests during development
  allowedDevOrigins: [
    '192.168.100.114',
    'localhost',
    '127.0.0.1',
    // Add any other IPs or domains you need for development
  ],
};

export default withNextIntl(nextConfig);
