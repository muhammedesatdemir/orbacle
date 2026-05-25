import { Hono } from 'hono';
import type { Env, RequestVars } from './types/env';
import { corsMiddleware } from './middleware/cors';
import { errorHandler } from './middleware/errorHandler';
import { healthRoute } from './routes/health';
import { configRoute } from './routes/config';
import { entitlementsRoute } from './routes/entitlements';
import { kahinRoute } from './routes/kahin';
import { deepRoute } from './routes/deep';
import { reportRoute } from './routes/report';
import { revenuecatWebhookRoute } from './routes/revenuecatWebhook';
import { devRoute } from './routes/dev';

const app = new Hono<{ Bindings: Env; Variables: RequestVars }>();

app.use('*', corsMiddleware);
app.onError(errorHandler);

// v1 API surface.
app.route('/v1/health', healthRoute);
app.route('/v1/config', configRoute);
app.route('/v1/entitlements', entitlementsRoute);
app.route('/v1/reading/kahin', kahinRoute);
app.route('/v1/reading/deep', deepRoute);
app.route('/v1/report', reportRoute);
app.route('/v1/revenuecat/webhook', revenuecatWebhookRoute);
// Development-only (returns 404 unless ENVIRONMENT==='development').
app.route('/v1/dev', devRoute);

// Root convenience.
app.get('/', (c) => c.json({ ok: true, service: 'orbacle-backend' }));

export default app;
