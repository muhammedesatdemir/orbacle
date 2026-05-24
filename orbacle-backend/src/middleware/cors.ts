import { cors } from 'hono/cors';

// Permissive CORS for the mobile client + local tooling. The app sends a custom
// X-Install-Id header, so it must be allowed. Tighten origins in production if a
// web client is ever added.
export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-Install-Id', 'X-Device-Platform', 'X-App-Version', 'Authorization'],
  maxAge: 86400,
});
