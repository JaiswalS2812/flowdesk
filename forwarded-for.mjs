// Preloaded into the production server (node --import ./forwarded-for.mjs).
//
// Next.js proxies /api/* to the backend (next.config.ts rewrites) but passes X-Forwarded-For
// through unchanged and does not add the address of the connection it received. The backend
// trusts X-Forwarded-For from this server (TRUSTED_PROXIES) to find the client IP for login
// throttling, so a client could otherwise choose its own IP by sending the header.
//
// Like a standard reverse proxy, this appends the address of the incoming connection, so the
// last entry is always one this server observed. The backend reads the list from the right
// and stops at the first address that is not a trusted proxy, so client-supplied entries
// further left are never used.
import http from 'node:http';

const createServer = http.createServer;

http.createServer = function (...args) {
  const server = createServer.apply(this, args);
  server.prependListener('request', (req) => {
    const peer = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
    if (!peer) return;
    const existing = req.headers['x-forwarded-for'];
    req.headers['x-forwarded-for'] = existing ? `${existing}, ${peer}` : peer;
  });
  return server;
};
