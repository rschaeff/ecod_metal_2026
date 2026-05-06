// Public-only config. The base path is set when the site is hosted behind
// a path prefix (e.g., /tricyp/...); empty string when served at the root.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
