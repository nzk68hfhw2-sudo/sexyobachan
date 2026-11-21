// Netlify Function: /api への通信をすべてここで受けます
import { getStore } from '@netlify/blobs';
import { createApp, blobsAdapter } from '../../lib/app.mjs';

let app;
export default async (req, context) => {
  if (!app) {
    app = createApp(blobsAdapter(getStore({ name: 'kojin-pages', consistency: 'strong' })), {
      adminId: process.env.ADMIN_ID || 'punpun2005',
      adminSetupCode: process.env.ADMIN_SETUP_CODE || '',
    });
  }
  const ip = (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  return app.handleRequest(req, ip);
};

export const config = { path: ['/api', '/api/*'] };
