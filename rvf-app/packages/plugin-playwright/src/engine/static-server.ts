import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

/**
 * Minimal real static-file server for  AC3's fixture test — serves a
 * REAL production build's `dist/` directory (the orders-app fixture under
 * rippleview-examples) over a real loopback HTTP server, so the EngineExecutor
 * navigates to and exercises the actual built bundle, never a `data:` URL
 * or an inline HTML string (G9: serve a production build, not a dev
 * server; and `data:` pages don't dispatch real `<script src>` network
 * requests, confirmed by the existing wait/test-helpers.ts precedent).
 */

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
};

export interface StaticServer {
  origin: string;
  close: () => Promise<void>;
}

/** Starts a real HTTP server rooted at `distDir`, falling back to
 * `index.html` for any path with no file extension (SPA-style routing). */
export async function startStaticServer(distDir: string): Promise<StaticServer> {
  const server = http.createServer((req, res) => {
    void serveRequest(distDir, req.url ?? '/', res);
  });

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  return {
    origin: `http://localhost:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

async function serveRequest(distDir: string, url: string, res: http.ServerResponse): Promise<void> {
  const requestedPath = url.split('?')[0] ?? '/';
  const hasExtension = path.extname(requestedPath) !== '';
  const relativePath = hasExtension ? requestedPath : '/index.html';

  try {
    const filePath = path.join(distDir, relativePath);
    const body = await readFile(filePath);
    const contentType = CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
}
