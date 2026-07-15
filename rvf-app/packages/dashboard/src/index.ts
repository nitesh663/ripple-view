export const VERSION = '0.0.0';

export type { DriftInfo, FleetCell, FleetAppRow, FleetChannel, FleetResponse } from './types.js';
export { computeDrift } from './drift.js';
export { FileRegistrySource } from './ingest/FileRegistrySource.js';
export type { RegistrySourceOptions } from './ingest/FileRegistrySource.js';
export { RegistryStore } from './registry/RegistryStore.js';
export { buildFleetResponse, registerFleetRoute } from './api/routes/fleet.js';
export { registerRegistrationRoute } from './api/routes/register.js';
export { createServer, startServer } from './api/server.js';
export type { ServerOptions } from './api/server.js';
