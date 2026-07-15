import { readFileSync } from 'node:fs';
import { RegistryDocumentSchema } from '@rippleview/registry';
import type { RegistryDocument } from '@rippleview/registry';

export interface RegistrySourceOptions {
  registryPath: string;
}

/**
 * PoC file-backed registry source.
 * Production will swap this for a Mongo/S3 adapter behind the same interface.
 */
export class FileRegistrySource {
  constructor(private readonly opts: RegistrySourceOptions) {}

  load(): RegistryDocument {
    const raw = readFileSync(this.opts.registryPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    return RegistryDocumentSchema.parse(parsed);
  }
}
