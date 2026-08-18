import { ParsedProxyConfig, CleanIpItem, DohQueryResult } from '../types';

export const BACKEND_URL = 'http://localhost:8080';

export async function checkPythonBackendStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/status`, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      return data.status === 'online';
    }
  } catch {}
  return false;
}

export async function scanCleanIpsViaPython(limit: number = 25): Promise<CleanIpItem[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/scan-clean-ips?limit=${limit}`, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      return data.results;
    }
  } catch {}
  return null;
}

export async function testConfigsViaPython(configs: ParsedProxyConfig[]): Promise<any[] | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/test-configs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs }),
      mode: 'cors'
    });
    if (res.ok) {
      const data = await res.json();
      return data.results;
    }
  } catch {}
  return null;
}

export async function queryDohViaPython(domain: string, provider: string): Promise<DohQueryResult | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/doh?domain=${encodeURIComponent(domain)}&provider=${encodeURIComponent(provider)}`, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      return {
        domain: data.domain,
        provider: data.provider,
        status: 0,
        ips: data.ips,
        ttl: data.ttl,
        durationMs: data.durationMs
      };
    }
  } catch {}
  return null;
}

export async function fetchMultiRepoCleanIpsViaPython(): Promise<{ results: CleanIpItem[]; totalFound: number } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/fetch-github-clean-ips`, { mode: 'cors' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch {}
  return null;
}

export async function runCloudflareCleanIpScanner(
  threads: number = 30,
  port: number = 443,
  countPerCidr: number = 4,
  withSpeed: boolean = true
): Promise<{ results: CleanIpItem[]; count: number } | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/scanner/run?threads=${threads}&port=${port}&count=${countPerCidr}&speed=${withSpeed ? '1' : '0'}`,
      { mode: 'cors' }
    );
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}

export async function runCustomIpScanViaPython(
  customIps: string[],
  threads: number = 50,
  port: number = 443,
  withSpeed: boolean = true
): Promise<{ results: CleanIpItem[]; count: number } | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/scanner/run-custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ips: customIps, threads, port, speed: withSpeed }),
      mode: 'cors'
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}
  return null;
}
