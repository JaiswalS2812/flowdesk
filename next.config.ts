import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Static CSP (pages are prerendered, so per-request nonces are not available).
// 'unsafe-inline' scripts are needed for Next.js's inline bootstrap scripts; dev adds
// eval and the hot-reload websocket. Fonts come from Google Fonts (app/layout.tsx).
// API calls go to this origin and are proxied to the backend by the rewrite below.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' blob: data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Pages and static assets; proxied /api responses keep the backend's own headers
        source: "/((?!api/).*)",
        headers: securityHeaders,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${
          process.env.BACKEND_API_URL || "http://localhost:8080"
        }/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
