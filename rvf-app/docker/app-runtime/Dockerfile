# app-runtime — builds an arbitrary consumer app against the candidate library
# and serves the PRODUCTION build (never a dev server).
#
# RippleView is a publisher-side gate that builds apps it does not control, so this
# Dockerfile is PARAMETERIZED via build-args — it hardcodes no framework, no
# output directory, and no Node version. The orchestrator resolves the
# consumer's build contract (rippleview.config.yaml + scripts/resolve-build-contract.mjs)
# and passes it as --build-arg's, selecting a final stage with --target.
#
# NODE_VERSION must be a concrete Docker tag fragment (e.g. 18 or 20.11.0); it
# is declared before the first FROM and re-declared inside every stage that
# uses it in a FROM (standard Docker ARG-scoping rule, G8 pinned bases).
ARG NODE_VERSION=20

# ── builder stage ─────────────────────────────────────────────────────────────
# Build with the candidate library transitively resolved. Install is package-
# manager-agnostic and deliberately NOT frozen:  prunes the overridden
# package's stale lock entry so a normal install re-resolves the candidate
# version-swap. A frozen/clean install would re-pin the old version from the
# lockfile and defeat the swap, so frozen-lockfile and clean-install modes
# MUST NOT be used in this stage.
FROM node:${NODE_VERSION}-bookworm-slim AS builder

ARG BUILD_CMD
ARG OUTPUT_DIR

WORKDIR /app

# Build context is the throwaway consumer-app copy prepared by the orchestrator.
COPY. .

# Detect the package manager by lockfile, install, then build. Prefer the
# explicit BUILD_CMD when provided; otherwise fall back to `<pm> run build`.
RUN corepack enable && \
    if [ -f pnpm-lock.yaml ]; then \
      PM=pnpm; \
    elif [ -f yarn.lock ]; then \
      PM=yarn; \
    else \
      PM=npm; \
    fi && \
    "$PM" install && \
    if [ -n "$BUILD_CMD" ]; then \
      sh -c "$BUILD_CMD"; \
    else \
      "$PM" run build; \
    fi

# ── static final stage (nginx) ────────────────────────────────────────────────
# Serves a static production build behind nginx with an SPA fallback so deep
# links don't 404. Selected via `docker build --target static`.
FROM nginx:1.27.3-alpine AS static

ARG OUTPUT_DIR

COPY --from=builder /app/${OUTPUT_DIR} /usr/share/nginx/html
# nginx.conf is RippleView's own file, not the consumer's — the primary build
# context here is a throwaway copy of the CONSUMER app (never RippleView's repo),
# so it must come from the secondary `rv-framework` build context that the
# orchestrator passes via `--build-context` (scripts/build-app-runtime-args.mjs).
COPY --from=rv-framework docker/app-runtime/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# `127.0.0.1`, not `localhost`: nginx only binds the IPv4 wildcard (`listen
# 80;` resolves to 0.0.0.0), but musl/Alpine's getaddrinfo resolves
# "localhost" to ::1 first, so wget tries IPv6 and gets connection-refused
# even though the app is healthy — this silently misclassified every healthy
# app as unhealthy (AC-3) until caught by a real end-to-end run ().
HEALTHCHECK --interval=5s --timeout=5s --retries=10 --start-period=10s \
  CMD wget --spider -q http://127.0.0.1:80/ || exit 1

# ── node final stage (production node server) ─────────────────────────────────
# Serves the built app via the consumer's declared start command. Carries the
# full /app tree (built output + node_modules) so the server can run. Selected
# via `docker build --target node`.
FROM node:${NODE_VERSION}-bookworm-slim AS node

ARG NODE_VERSION
ARG START_CMD
ARG PORT=3000

WORKDIR /app

COPY --from=builder /app /app

ENV PORT=${PORT}
EXPOSE ${PORT}

# See the static stage's healthcheck comment above — same 127.0.0.1 fix.
HEALTHCHECK --interval=5s --timeout=5s --retries=10 --start-period=10s \
  CMD wget --spider -q http://127.0.0.1:${PORT}/ || exit 1

CMD ["sh", "-c", "$START_CMD"]
