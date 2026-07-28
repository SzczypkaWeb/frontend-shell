// Base URL for the backend API. Configurable via the API_URL environment
// variable (injected at build time, see webpack.config.ts) so the shell
// never hardcodes a specific backend host.
export const API_BASE_URL = process.env.API_URL ?? 'http://localhost:3000';
