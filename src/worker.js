/**
 * Reading Assistant - Cloudflare Worker
 * Clean, simple implementation
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
// import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

import studentRoutes from './routes/students.js';
import classRoutes from './routes/classes.js';
import bookRoutes from './routes/books.js';
import genreRoutes from './routes/genres.js';
import sessionRoutes from './routes/sessions.js';
import recommendationRoutes from './routes/recommendations.js';
import settingsRoutes from './routes/settings.js';
import dataRoutes from './routes/data.js';

import { initializeDefaultGenres, initializeDefaultSettings } from './data/kvProvider.js';

const app = new Hono();

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: (origin) => origin?.includes('localhost') || origin?.includes('127.0.0.1') ? origin : '*',
  credentials: true,
}));

app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  environment: c.env.ENVIRONMENT || 'development'
}));

app.route('/api/students', studentRoutes);
app.route('/api/classes', classRoutes);
app.route('/api/books', bookRoutes);
app.route('/api/genres', genreRoutes);
app.route('/api/sessions', sessionRoutes);
app.route('/api/recommendations', recommendationRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/data', dataRoutes);

app.get('*', async (c) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;

  // Handle API routes and health checks
  if (pathname.startsWith('/api/') || pathname.startsWith('/health')) {
    return c.notFound();
  }

  // Try to serve static assets from ASSETS binding
  try {
    const assetPath = pathname === '/' ? '/index.html' : pathname;
    console.log('Looking for asset:', assetPath);
    
    const asset = await c.env.ASSETS.fetch(new Request(`https://example.com${assetPath}`));
    
    if (asset.ok) {
      console.log('Serving asset:', assetPath, 'with status:', asset.status);
      
      // Clone the response to modify headers
      const response = new Response(asset.body, {
        status: asset.status,
        statusText: asset.statusText,
        headers: asset.headers
      });
      
      // Ensure proper MIME types for JavaScript files
      if (pathname.endsWith('.js')) {
        response.headers.set('Content-Type', 'application/javascript');
      }
      
      // Set cache headers
      if (pathname === '/' || pathname === '/index.html') {
        response.headers.set('Cache-Control', 'no-cache');
      } else {
        response.headers.set('Cache-Control', 'public, max-age=31536000');
      }
      
      return response;
    } else {
      console.log('Asset not found:', assetPath, 'status:', asset.status);
    }
  } catch (error) {
    console.error('Error serving asset:', error);
  }

  // If no static asset found and it's not the root, try to serve index.html for SPA routing
  if (pathname !== '/') {
    try {
      const indexAsset = await c.env.ASSETS.fetch(new Request('https://example.com/index.html'));
      if (indexAsset.ok) {
        return new Response(indexAsset.body, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          }
        });
      }
    } catch (error) {
      console.error('Error serving index.html:', error);
    }
  }

  // Fallback HTML if assets are not available
  return c.html(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reading Assistant - Primary School Reading Tracker</title>
    <meta name="description" content="A comprehensive reading tracking system for primary school students with AI-powered book recommendations" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <!-- Preconnect to fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
      rel="stylesheet"
    />
    <!-- Material Icons -->
    <link
      href="https://fonts.googleapis.com/icon?family=Material+Icons"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <!-- Scripts will be injected here by the build process -->
  <script defer src="/static/js/lib-react.fd756841.js"></script><script defer src="/static/js/lib-router.7cc6ab1b.js"></script><script defer src="/static/js/366.42b9c958.js"></script><script defer src="/static/js/index.3ed40cec.js"></script></body>
</html>`);
});

// Helper function to determine content type
function getContentType(pathname) {
  const ext = pathname.split('.').pop()?.toLowerCase();
  const types = {
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'svg': 'image/svg+xml',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'html': 'text/html',
    'ico': 'image/x-icon',
    'txt': 'text/plain'
  };
  return types[ext] || 'application/octet-stream';
}


app.onError((err, c) => {
  console.error('Worker error:', err);
  return c.json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } }, 500);
});

app.notFound((c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api/')) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'API endpoint not found' } }, 404);
  }
  return c.text('Page not found', { status: 404 });
});

export default {
  async fetch(request, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          await initializeDefaultGenres(env.READING_ASSISTANT_KV);
          await initializeDefaultSettings(env.READING_ASSISTANT_KV);
        } catch (error) {
          console.error('Failed to initialize default data:', error);
        }
      })()
    );

    return app.fetch(request, { ...env, ctx });
  }
};