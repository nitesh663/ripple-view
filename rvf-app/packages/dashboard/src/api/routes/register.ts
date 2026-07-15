import type { FastifyInstance } from 'fastify';
import { RegistryDocumentSchema } from '@rippleview/registry';
import type { RegistryStore } from '../../registry/RegistryStore.js';

export function registerRegistrationRoute(fastify: FastifyInstance, store: RegistryStore): void {
  fastify.post('/api/register', async (request, reply) => {
    const parsed = RegistryDocumentSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'Invalid registry document', details: parsed.error.issues });
    }
    store.merge(parsed.data);
    return reply.code(200).send({ ok: true });
  });
}
