import { EventEmitter } from 'node:events';
import type { RegistryDocument } from '@rippleview/registry';

export class RegistryStore extends EventEmitter {
  private doc: RegistryDocument = {};

  get(): RegistryDocument {
    return this.doc;
  }

  isEmpty(): boolean {
    return Object.keys(this.doc).length === 0;
  }

  merge(partial: RegistryDocument): void {
    for (const [fw, genMap] of Object.entries(partial)) {
      if (!this.doc[fw]) this.doc[fw] = {};
      for (const [gen, pkgMap] of Object.entries(genMap)) {
        const fwDoc = this.doc[fw];
        if (!fwDoc) continue;
        if (!fwDoc[gen]) fwDoc[gen] = {};
        for (const [pkg, entry] of Object.entries(pkgMap)) {
          const genDoc = fwDoc[gen];
          if (!genDoc) continue;
          const existing = genDoc[pkg];
          if (existing) {
            // Additive merge: keep the non-empty latest (library registration
            // may arrive before or after consumer registrations), and union
            // all consumers so separate-repo registrations accumulate correctly.
            genDoc[pkg] = {
              latest: entry.latest || existing.latest,
              consumers: { ...existing.consumers, ...entry.consumers },
            };
          } else {
            genDoc[pkg] = { ...entry, consumers: { ...entry.consumers } };
          }
        }
      }
    }
    this.emit('updated');
  }

  reset(): void {
    this.doc = {};
    this.emit('updated');
  }
}
