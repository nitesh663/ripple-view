import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { FileRegistrySource } from '../ingest/FileRegistrySource.js';
import { RegistryStore } from '../registry/RegistryStore.js';
import { registerFleetRoute } from './routes/fleet.js';
import { registerRegistrationRoute } from './routes/register.js';

export interface ServerOptions {
  /** Path to an existing registry.json for initial data. If omitted the store starts empty. */
  registryPath?: string;
  port: number;
}

export async function createServer(opts: ServerOptions) {
  const fastify = Fastify({ logger: false });
  const store = new RegistryStore();

  if (opts.registryPath) {
    const source = new FileRegistrySource({ registryPath: opts.registryPath });
    store.merge(source.load());
  }

  registerFleetRoute(fastify, () => store.get());
  registerRegistrationRoute(fastify, store);

  // SSE — browsers subscribe here; store emits 'updated' on each registration
  fastify.get('/api/events', (request, reply) => {
    reply.hijack();
    const res = reply.raw;
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(': connected\n\n');

    const sendUpdate = () => {
      res.write('data: {"type":"registry-updated"}\n\n');
    };

    store.on('updated', sendUpdate);
    request.raw.on('close', () => {
      store.off('updated', sendUpdate);
      res.end();
    });
  });

  // Serve the pre-built SPA from dist/ui/ (produced by `vite build`).
  // In dev the Vite dev server proxies /api/* to this Fastify process.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const uiDir = join(__dirname, 'ui'); // dist/index.js → dist/ui/

  if (existsSync(uiDir)) {
    await fastify.register(fastifyStatic, { root: uiDir, prefix: '/' });

    fastify.setNotFoundHandler(async (request, reply) => {
      if (!request.url.startsWith('/api/')) {
        return reply.sendFile('index.html');
      }
      return reply.status(404).send({ error: 'Not Found' });
    });
  }

  return fastify;
}

export async function startServer(opts: ServerOptions): Promise<void> {
  const server = await createServer(opts);
  // '::' binds to all IPv6 interfaces and, on most OSes (including Windows),
  // also accepts IPv4 connections via dual-stack — so both localhost (::1)
  // and 127.0.0.1 reach the server.
  await server.listen({ port: opts.port, host: '::' });
  process.stdout.write(`Dashboard running at http://localhost:${String(opts.port)}\n`);
}
