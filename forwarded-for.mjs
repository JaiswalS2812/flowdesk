// Preloaded into the production server (node --import ./forwarded-for.mjs).
//
// Next.js proxies /api/* to the backend (next.config.ts rewrites) but passes X-Forwarded-For
// through unchanged and does not add the address of the connection it received. The backend
// trusts X-Forwarded-For from this server (TRUSTED_PROXIES) to find the client IP for login
// throttling, so a client could otherwise choose its own IP by sending the header.
//
// Default (direct connections, e.g. Docker Compose): like a standard reverse proxy, append the
// address of the incoming connection, so the last entry is always one this server observed.
// The backend reads the list from the right and stops at the first address that is not a
// trusted proxy, so client-supplied entries further left are never used.
//
// Behind a platform edge proxy (CLIENT_IP_HEADER set, e.g. "x-real-ip" on Railway): every
// connection comes from the edge, so the connection address is not the client. The edge sets
// that header to the client IP and always overwrites any client-supplied value, so it replaces
// X-Forwarded-For entirely. Only set CLIENT_IP_HEADER when the server is reachable solely
// through such an edge.
import http from 'node:http';

const clientIpHeader = (process.env.CLIENT_IP_HEADER || '').trim().toLowerCase();
const IP = /^[0-9a-fA-F.:]+$/;

const createServer = http.createServer;

http.createServer = function (...args) {
  const server = createServer.apply(this, args);
  server.prependListener('request', (req) => {
    const peer = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');

    if (clientIpHeader) {
      const edgeClientIp = String(req.headers[clientIpHeader] || '').trim();
      req.headers['x-forwarded-for'] = IP.test(edgeClientIp) ? edgeClientIp : peer;
      return;
    }

    if (!peer) return;
    const existing = req.headers['x-forwarded-for'];
    req.headers['x-forwarded-for'] = existing ? `${existing}, ${peer}` : peer;
  });
  return server;
};
