import http from 'http';
import https from 'https';
import { URL } from 'url';

const PORT = process.env.PORT || 8080;

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${req.headers.host}`);

  // Endpoint 1: CORS Proxy for fetching raw subscriptions
  if (reqUrl.pathname === '/api/fetch-sub') {
    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing target url parameter' }));
      return;
    }

    try {
      const response = await fetch(targetUrl, {
        headers: { 'User-Agent': 'v2rayNG/1.8.12' }
      });
      const data = await response.text();
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(data);
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Endpoint 2: DNS-over-HTTPS Resolver
  if (reqUrl.pathname === '/api/doh') {
    const domain = reqUrl.searchParams.get('name');
    const provider = reqUrl.searchParams.get('provider') || 'https://1.1.1.1/dns-query';

    if (!domain) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing name parameter' }));
      return;
    }

    try {
      const dohRes = await fetch(`${provider}?name=${encodeURIComponent(domain)}&type=A`, {
        headers: { Accept: 'application/dns-json' }
      });
      const data = await dohRes.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Endpoint 3: GeoIP & ASN Inspector
  if (reqUrl.pathname === '/api/geoip') {
    const ip = reqUrl.searchParams.get('ip') || '';
    try {
      const geoRes = await fetch(`https://ipwho.is/${ip}`);
      const data = await geoRes.json();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // Default Health Check
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'online', service: 'CF-Optimizor Backend Engine', version: '4.5.0' }));
});

server.listen(PORT, () => {
  console.log(`[CF-Optimizor Backend] Running on port ${PORT}`);
});
