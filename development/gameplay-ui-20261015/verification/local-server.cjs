'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../public');
const port = 8806;
// Browser tests must not load a production SDK, connect to a backend, or register a service worker.
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; frame-src 'self'; connect-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'";
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.webp': 'image/webp' };
const requests = [];
function resolvePath(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://127.0.0.1:' + port).pathname);
  if (pathname.includes('\\') || /firebase|service-worker|^\/admin|^\/__phase1/i.test(pathname)) throw new Error('Not available in offline UI verification');
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) throw new Error('Unsafe path');
  return file;
}
function offlineHtml(html) {
  return html.replace(/<script\b[^>]*\bsrc="(?:https?:\/\/[^"\s]+|firebase-auth\.js[^"\s]*)"[^>]*>\s*<\/script>/g, '<!-- External SDK omitted only in offline verification -->');
}
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (!['127.0.0.1:' + port, 'localhost:' + port].includes(req.headers.host)) throw new Error('Unexpected host');
    if (!['GET', 'HEAD'].includes(req.method)) throw new Error('Read-only verification server');
    requests.push({ method: req.method, url: req.url });
    if (req.url === '/verification-auth.js') {
      res.setHeader('Content-Type', types['.js']);
      const prelude = await fs.promises.readFile(path.join(__dirname, 'auth-fixture-prelude.js'), 'utf8');
      const auth = await fs.promises.readFile(path.join(root, 'firebase-auth.js'), 'utf8');
      res.end(prelude + '\n' + auth.replace(/^import [\s\S]*? from "[^"]+";\s*/gm, ''));
      return;
    }
    if (req.url === '/verification-fixture.js') {
      res.setHeader('Content-Type', types['.js']);
      res.end(await fs.promises.readFile(path.join(__dirname, 'fixture.js')));
      return;
    }
    if (req.url === '/verification-requests.json') {
      res.setHeader('Content-Type', types['.json']);
      res.end(JSON.stringify({ offline: true, csp, requests }));
      return;
    }
    if (new URL(req.url,'http://localhost').pathname === '/intro-review.html') {
      res.setHeader('Content-Type',types['.html']);
      res.end(await fs.promises.readFile(path.join(__dirname,'intro-review.html')));return;
    }
    const file = resolvePath(req.url);
    const ext = path.extname(file);
    let data = await fs.promises.readFile(file);
    if (ext === '.html') {
      let html = offlineHtml(data.toString('utf8'));
      if (['children','guest'].includes(new URL(req.url, 'http://localhost').searchParams.get('verification'))) html = html.replace('</head>', '<script src="/verification-fixture.js"></script><script type="module" src="/verification-auth.js"></script></head>');
      data = Buffer.from(html);
    }
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    res.statusCode = 403;
    res.end(error.message);
  }
});
if (require.main === module) server.listen(port, '127.0.0.1', () => console.log('Offline UI verification only: http://127.0.0.1:' + port + '/?page=home'));
module.exports = { server, csp, resolvePath, offlineHtml };


