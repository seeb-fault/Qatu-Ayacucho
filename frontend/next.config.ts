import type { NextConfig } from "next";

const desarrollo = process.env.NODE_ENV !== 'production';

/**
 * Política de contenido (OWASP ZAP 10038/10020). Orígenes externos que usa Qatu:
 * Culqi (checkout de pago, scripts, iframes y API) y los mosaicos de OpenStreetMap.
 * Next.js inyecta scripts en línea para hidratar, por eso 'unsafe-inline' en script-src;
 * en desarrollo React además necesita 'unsafe-eval'.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ''} https://*.culqi.com`,
  "style-src 'self' 'unsafe-inline' https://*.culqi.com",
  "img-src 'self' data: blob: https://tile.openstreetmap.org https://*.culqi.com",
  "font-src 'self' data: https://*.culqi.com",
  `connect-src 'self' https://*.culqi.com${desarrollo ? ' ws:' : ''}`,
  "frame-src https://*.culqi.com",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const cabeceras = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // La geolocalización la usa el mapa para "usar mi ubicación"; el resto se desactiva.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(self "https://checkout.culqi.com"), geolocation=(self)' },
  // same-origin-allow-popups: el checkout de Culqi puede abrir ventanas propias.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  // Sin Cross-Origin-Embedder-Policy: require-corp bloquearía los mosaicos de OpenStreetMap y el checkout de Culqi.
];

const config: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.QATU_NEXT_DIST_DIR ?? '.next',
  experimental: { proxyClientMaxBodySize: 12 * 1024 * 1024 },
  async headers() {
    return [{ source: '/:path*', headers: cabeceras }];
  },
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/:path*` }];
  },
};
export default config;
