# rv-runner — deterministic validation runner image (G8)
# Base: pinned Playwright image (includes Node 20 + all browsers on Ubuntu Noble)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /rv

# Copy manifests first for layer-cache efficiency
COPY package.json package-lock.json tsconfig.base.json ./

COPY packages/core/package.json ./packages/core/
COPY packages/cli/package.json ./packages/cli/
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/lint/package.json ./packages/lint/

# Install all workspace dependencies (frozen for determinism, G13)
RUN npm ci

# Copy source trees needed for the CLI
COPY packages/core/src ./packages/core/src
COPY packages/core/tsconfig.json ./packages/core/
COPY packages/cli/src ./packages/cli/src
COPY packages/cli/tsconfig.json ./packages/cli/
COPY packages/cli/tsup.config.ts ./packages/cli/

# `rv gate` () invokes root scripts/* build/orchestration utilities
# via a relative import (packages/cli is allowed to call these; see
# packages/cli/src/commands/gateDeps.ts) — they must ship inside this image
# too, or the CLI's own build fails to resolve them.
COPY scripts ./scripts

# Build core then CLI
RUN npm run build -w @rippleview/core && \
    npm run build -w @rippleview/cli

# Expose the CLI as `rv` on PATH (G7: CLI is the only CI contract)
RUN chmod +x /rv/packages/cli/dist/cli.js && \
    ln -s /rv/packages/cli/dist/cli.js /usr/local/bin/rv

# /data is the mount point for workspace configs and result output (AC-2)
WORKDIR /data

ENTRYPOINT ["rv"]
CMD ["--help"]
