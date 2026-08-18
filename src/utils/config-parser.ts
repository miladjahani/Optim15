import { ParsedProxyConfig, ProxyChainSettings } from '../types';

export const VALID_PROTOCOLS = ['vless://', 'trojan://', 'vmess://', 'ss://', 'hysteria2://', 'hy2://', 'tuic://', 'wireguard://', 'wg://'];

export function isHtmlContent(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('<?xml') ||
    (trimmed.includes('<head>') && trimmed.includes('<body>'))
  );
}

export function parseBatchConfigs(input: string): ParsedProxyConfig[] {
  let content = input.trim();
  if (!content) return [];

  // Reject raw HTML
  if (isHtmlContent(content)) return [];

  // Base64 decode check
  if (!content.includes('://') && content.length > 20 && !content.startsWith('{')) {
    try {
      const decoded = decodeURIComponent(escape(atob(content)));
      if (!isHtmlContent(decoded)) content = decoded;
    } catch {
      try {
        const decoded = atob(content);
        if (!isHtmlContent(decoded)) content = decoded;
      } catch {}
    }
  }

  // Parse JSON outbounds if Sing-Box / Xray
  if (content.startsWith('{') || content.startsWith('[')) {
    try {
      const obj = JSON.parse(content);
      const list: ParsedProxyConfig[] = [];
      const outbounds = Array.isArray(obj) ? obj : obj.outbounds || [];
      for (const ob of outbounds) {
        if (['vless', 'trojan', 'vmess', 'shadowsocks', 'ss'].includes(ob.type)) {
          list.push({
            id: Math.random().toString(36).substring(2, 9),
            protocol: ob.type === 'shadowsocks' ? 'ss' : ob.type,
            uuid: ob.uuid || ob.password || '',
            server: ob.server || '104.16.1.1',
            port: ob.server_port || 443,
            name: ob.tag || `${ob.type.toUpperCase()} Node`,
            transport: ob.transport?.type || 'ws',
            security: ob.tls?.enabled ? 'tls' : 'none',
            sni: ob.tls?.server_name || ob.server || '',
            host: ob.transport?.headers?.Host || ob.server || '',
            path: ob.transport?.path || '/',
            alpn: (ob.tls?.alpn || ['h2', 'http/1.1']).join(','),
            fingerprint: ob.tls?.utls?.fingerprint || 'chrome',
            earlyData: '2048',
            fragmentEnabled: !!ob.tls?.fragment?.enabled,
            fragmentLength: ob.tls?.fragment?.length || '100-200',
            fragmentInterval: ob.tls?.fragment?.interval || '10-20',
            fragmentPackets: '1-3',
            raw: JSON.stringify(ob)
          });
        }
      }
      if (list.length > 0) return list;
    } catch {}
  }

  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => {
    return VALID_PROTOCOLS.some((proto) => l.startsWith(proto));
  });

  const results: ParsedProxyConfig[] = [];

  for (const line of lines) {
    try {
      if (line.startsWith('vless://') || line.startsWith('trojan://')) {
        const u = new URL(line);
        const uuid = u.username || '';
        const server = u.hostname || '';
        const port = parseInt(u.port, 10) || 443;
        const name = decodeURIComponent(u.hash ? u.hash.substring(1) : 'Node');
        const params = u.searchParams;

        results.push({
          id: Math.random().toString(36).substring(2, 9),
          protocol: u.protocol.replace(':', '') as any,
          uuid,
          server,
          port,
          name,
          transport: (params.get('type') as any) || 'ws',
          security: (params.get('security') as any) || 'tls',
          sni: params.get('sni') || params.get('host') || server,
          host: params.get('host') || params.get('sni') || server,
          path: params.get('path') || '/',
          alpn: params.get('alpn') || 'h2,http/1.1',
          fingerprint: params.get('fp') || 'chrome',
          earlyData: params.get('ed') || '2048',
          fragmentEnabled: true,
          fragmentLength: '100-200',
          fragmentInterval: '10-20',
          fragmentPackets: '1-3',
          raw: line
        });
      } else if (line.startsWith('vmess://')) {
        const b64 = line.replace('vmess://', '');
        const v = JSON.parse(decodeURIComponent(escape(atob(b64))));
        results.push({
          id: Math.random().toString(36).substring(2, 9),
          protocol: 'vmess',
          uuid: v.id || '',
          server: v.add || '',
          port: parseInt(v.port, 10) || 443,
          name: v.ps || 'VMess Node',
          transport: (v.net as any) || 'ws',
          security: v.tls === 'tls' ? 'tls' : 'none',
          sni: v.sni || v.host || v.add,
          host: v.host || v.sni || v.add,
          path: v.path || '/',
          alpn: v.alpn || 'h2,http/1.1',
          fingerprint: v.fp || 'chrome',
          earlyData: '2048',
          fragmentEnabled: false,
          fragmentLength: '100-200',
          fragmentInterval: '10-20',
          fragmentPackets: '1-3',
          raw: line
        });
      } else if (line.startsWith('ss://')) {
        const u = new URL(line);
        results.push({
          id: Math.random().toString(36).substring(2, 9),
          protocol: 'ss',
          uuid: u.username || '',
          server: u.hostname || '',
          port: parseInt(u.port, 10) || 443,
          name: decodeURIComponent(u.hash ? u.hash.substring(1) : 'SS Node'),
          transport: 'tcp',
          security: 'none',
          sni: u.hostname || '',
          host: u.hostname || '',
          path: '/',
          alpn: 'h2,http/1.1',
          fingerprint: 'chrome',
          earlyData: '2048',
          fragmentEnabled: false,
          fragmentLength: '100-200',
          fragmentInterval: '10-20',
          fragmentPackets: '1-3',
          raw: line
        });
      }
    } catch {}
  }

  return results;
}

export async function resolveInputToConfigs(input: string): Promise<ParsedProxyConfig[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const proxies = [
      trimmed,
      `https://corsproxy.io/?${encodeURIComponent(trimmed)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmed)}`
    ];

    for (const p of proxies) {
      try {
        const res = await fetch(p, { headers: { 'User-Agent': 'v2rayNG/1.8.12' } });
        if (res.ok) {
          const text = await res.text();
          if (text && !isHtmlContent(text)) {
            const parsed = parseBatchConfigs(text);
            if (parsed.length > 0) return parsed;
          }
        }
      } catch {}
    }
    throw new Error('لینک سابسکریپشن پاسخ معتبر پروکسی بازنگرداند.');
  }

  return parseBatchConfigs(trimmed);
}

export function buildOptimizedVlessUri(
  cfg: ParsedProxyConfig,
  cleanIp?: string,
  customName?: string
): string {
  const targetServer = cleanIp || cfg.server;
  const targetName = customName || cfg.name;

  if (cfg.protocol === 'trojan') {
    const params = new URLSearchParams();
    params.set('type', cfg.transport || 'ws');
    params.set('security', cfg.security || 'tls');
    if (cfg.path) params.set('path', cfg.path);
    if (cfg.host) params.set('host', cfg.host);
    if (cfg.sni) params.set('sni', cfg.sni);
    if (cfg.fingerprint) params.set('fp', cfg.fingerprint);
    if (cfg.cipherSuites) params.set('cs', cfg.cipherSuites);
    if (cfg.finalMask) params.set('fm', cfg.finalMask);
    return `trojan://${cfg.uuid}@${targetServer}:${cfg.port}?${params.toString()}#${encodeURIComponent(targetName)}`;
  }

  const params = new URLSearchParams();
  params.set('type', cfg.transport || 'ws');
  params.set('security', cfg.security || 'tls');
  if (cfg.path) params.set('path', cfg.path);
  if (cfg.host) params.set('host', cfg.host);
  if (cfg.sni) params.set('sni', cfg.sni);
  if (cfg.alpn) params.set('alpn', cfg.alpn);
  if (cfg.fingerprint) params.set('fp', cfg.fingerprint);
  if (cfg.earlyData) params.set('ed', cfg.earlyData);
  if (cfg.cipherSuites) params.set('cs', cfg.cipherSuites);
  if (cfg.finalMask) params.set('fm', cfg.finalMask);

  return `vless://${cfg.uuid}@${targetServer}:${cfg.port}?${params.toString()}#${encodeURIComponent(targetName)}`;
}

export function buildSingBoxJson(configs: ParsedProxyConfig[], chain?: ProxyChainSettings): string {
  const outbounds: any[] = [];

  configs.forEach((c) => {
    outbounds.push({
      type: c.protocol === 'trojan' ? 'trojan' : c.protocol === 'ss' ? 'shadowsocks' : 'vless',
      tag: c.name,
      server: c.server,
      server_port: c.port,
      uuid: c.uuid,
      password: c.protocol === 'trojan' || c.protocol === 'ss' ? c.uuid : undefined,
      tls: {
        enabled: c.security === 'tls',
        server_name: c.sni || c.host,
        alpn: (c.alpn || 'h2,http/1.1').split(','),
        utls: { enabled: true, fingerprint: c.fingerprint || 'chrome' },
        fragment: { enabled: true, length: '100-200', interval: '10-20' }
      },
      transport: {
        type: c.transport,
        path: c.path,
        headers: { Host: c.host || c.sni }
      }
    });
  });

  outbounds.push({ type: 'direct', tag: 'direct' });
  outbounds.push({ type: 'block', tag: 'block' });

  return JSON.stringify({
    log: { level: 'info', timestamp: true },
    dns: {
      servers: [
        { tag: 'remote-dns', address: 'https://1.1.1.1/dns-query', detour: 'direct' },
        { tag: 'local-dns', address: 'local', detour: 'direct' }
      ]
    },
    inbounds: [{ type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: 2080 }],
    outbounds
  }, null, 2);
}

export function buildClashMetaYaml(configs: ParsedProxyConfig[]): string {
  const proxies = configs.map((c) => {
    return `  - name: "${c.name}"
    type: ${c.protocol === 'trojan' ? 'trojan' : c.protocol === 'ss' ? 'ss' : 'vless'}
    server: ${c.server}
    port: ${c.port}
    uuid: ${c.uuid}
    password: ${c.uuid}
    tls: ${c.security === 'tls'}
    servername: ${c.sni || c.host}
    network: ${c.transport}
    ws-opts:
      path: "${c.path}"
      headers:
        Host: "${c.host || c.sni}"
    client-fingerprint: ${c.fingerprint || 'chrome'}`;
  }).join('\n');

  return `port: 7890
socks-port: 7891
mode: rule
proxies:
${proxies}
rules:
  - MATCH,DIRECT
`;
}
