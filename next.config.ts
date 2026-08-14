import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const isDev = process.env.NODE_ENV === 'development';

// Derive the backend API origin from NEXT_PUBLIC_API_URL so connect-src
// matches whatever backend this deployment actually points at (each client
// deployment has its own Render backend URL).
function apiOrigin(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || '').origin;
  } catch {
    return "'self'";
  }
}

// upgrade-insecure-requests forces every fetch onto https:// — correct for
// the real deployments (Render/Netlify, both https), but it breaks local
// dev, where the frontend and NEXT_PUBLIC_API_URL are plain http://
// (upgrading those requests to https locally fails with ERR_SSL_PROTOCOL_ERROR
// since nothing is listening for TLS on those ports) — so it's dev-excluded.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://res.cloudinary.com;
  font-src 'self' data:;
  connect-src 'self' ${apiOrigin()};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ${isDev ? '' : 'upgrade-insecure-requests;'}
`;

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
  async headers() {
    const headers = [
      { key: 'Content-Security-Policy', value: cspHeader.replace(/\s{2,}/g, ' ').trim() },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ];
    // HSTS tells the browser "only ever use https for this host" — correct
    // for the real https deployments, but pinning that onto localhost during
    // dev risks the browser trying to upgrade the plain-http dev server too.
    if (!isDev) {
      headers.push({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' });
    }
    return [{ source: '/(.*)', headers }];
  },
};

export default withNextIntl(nextConfig);
