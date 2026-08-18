import { DohProvider, DohQueryResult } from '../types';

export const DOH_PROVIDERS: DohProvider[] = [
  { id: 'cf', name: 'Cloudflare DoH (1.1.1.1)', url: 'https://1.1.1.1/dns-query', type: 'global', supportsJson: true },
  { id: 'google', name: 'Google Public DoH (8.8.8.8)', url: 'https://dns.google/resolve', type: 'global', supportsJson: true },
  { id: 'quad9', name: 'Quad9 Security DoH (9.9.9.9)', url: 'https://dns.quad9.net/dns-query', type: 'security', supportsJson: true },
  { id: 'adguard', name: 'AdGuard Privacy DoH', url: 'https://dns.adguard-dns.com/dns-query', type: 'security', supportsJson: true },
  { id: 'shecan', name: 'Shecan Anti-Sanction (Iran)', url: 'https://178.22.122.100/dns-query', type: 'anti_sanction', supportsJson: false },
  { id: 'electro', name: 'Electro DNS (Iran)', url: 'https://37.152.182.112/dns-query', type: 'anti_sanction', supportsJson: false }
];

export async function queryDoh(domain: string, providerId: string = 'cf'): Promise<DohQueryResult> {
  const provider = DOH_PROVIDERS.find((p) => p.id === providerId) || DOH_PROVIDERS[0];
  const startTime = performance.now();

  try {
    let queryUrl = '';
    if (provider.id === 'google') {
      queryUrl = `${provider.url}?name=${encodeURIComponent(domain)}&type=A`;
    } else {
      queryUrl = `${provider.url}?name=${encodeURIComponent(domain)}&type=A`;
    }

    const res = await fetch(queryUrl, {
      headers: {
        Accept: 'application/dns-json'
      }
    });

    const durationMs = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const data = await res.json();
    const ips: string[] = (data.Answer || [])
      .filter((ans: any) => ans.type === 1) // Type 1 = A record
      .map((ans: any) => ans.data);

    const ttl = data.Answer?.[0]?.TTL || 300;

    return {
      domain,
      provider: provider.name,
      status: data.Status || 0,
      ips: ips.length > 0 ? ips : ['No A record found'],
      ttl,
      durationMs
    };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    return {
      domain,
      provider: provider.name,
      status: -1,
      ips: [`Error: ${err.message}`],
      ttl: 0,
      durationMs
    };
  }
}
