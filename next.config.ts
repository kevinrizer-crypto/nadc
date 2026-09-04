import type { NextConfig } from "next";

// Security headers applied to every response. CSP allows MapLibre (blob: workers),
// OpenFreeMap tiles, Stripe JS/Checkout, and Cloudflare Turnstile — nothing else.
// 'unsafe-eval' is required by webpack's dev runtime only — never shipped in production.
const devScript = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devScript} https://js.stripe.com https://challenges.cloudflare.com https://www.redditstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // Turnstile needs connect-src as well as script-src: api.js loads under
  // script-src, but the challenge itself XHRs back to challenges.cloudflare.com.
  // Omit it and the widget never renders, so no token is ever issued and every
  // bot-checked form fails closed.
  "connect-src 'self' https://tiles.openfreemap.org https://api.stripe.com https://*.reddit.com https://www.redditstatic.com https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-src https://js.stripe.com https://checkout.stripe.com https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // neighborsagainstdatacenters.com → nadc.info (301). Also enforced at
      // Cloudflare via a redirect rule — this is the application-level backstop.
      {
        source: "/:path*",
        has: [{ type: "host", value: "neighborsagainstdatacenters.com" }],
        destination: "https://nadc.info/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.neighborsagainstdatacenters.com" }],
        destination: "https://nadc.info/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.nadc.info" }],
        destination: "https://nadc.info/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
