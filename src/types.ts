export type AppTab =
  | 'optimizer'      // ⚡ بهینه‌ساز کانفیگ (Exact ArasTey cf-optimizor)
  | 'ip_scanner'     // 🧪 اسکنر آی‌پی تمیز (Cloudflare-Clean-IP-Scanner full scale)
  | 'sub_converter'  // 🔗 سابسکریپشن و مبدل کلاینت‌ها (MiSub + Universal Converter)
  | 'live_ping'      // 🎮 پینگ زنده گیمینگ، هوش مصنوعی و کانفیگ‌ها
  | 'db_toolkit';    // 💾 پایگاه داده، DoH، دکتر نود و جعبه‌ابزار

export type Language = 'fa' | 'en';
export type Theme = 'dark' | 'light';

export interface ProxyChainSettings {
  enabled: boolean;
  type: 'socks5' | 'http' | 'proxyip';
  server: string;
  port: number;
  username?: string;
  password?: string;
  proxyIp?: string;
  label?: string;
}

export interface ParsedProxyConfig {
  id: string;
  protocol: 'vless' | 'trojan' | 'vmess' | 'ss' | 'hysteria2' | 'tuic' | 'wireguard' | 'unknown';
  uuid: string;
  server: string;
  port: number;
  name: string;
  transport: 'ws' | 'grpc' | 'httpupgrade' | 'tcp' | 'h2' | 'quic';
  security: 'tls' | 'reality' | 'none';
  sni: string;
  host: string;
  path: string;
  alpn: string;
  fingerprint: string;
  earlyData: string;
  fragmentEnabled: boolean;
  fragmentLength: string;
  fragmentInterval: string;
  fragmentPackets: string;
  cipherSuites?: string;
  finalMask?: string;
  proxyIp?: string;
  chain?: ProxyChainSettings;
  createdAt?: string;
  raw: string;
}

export interface CleanIpItem {
  ip: string;
  port: number;
  operator: 'mci' | 'mtn' | 'rtl' | 'shatel' | 'global' | 'fastly' | 'ai_proxyip';
  label: string;
  latency: number | null;
  ttfb?: number | null;
  jitter?: number | null;
  speedMbps?: number | null;
  speedMBs?: number | null;
  packetLoss?: number;
  colo?: string;
  status: 'idle' | 'testing' | 'success' | 'timeout';
}

export interface SavedSubscriptionRecord {
  id: string;
  title: string;
  url: string;
  gistId?: string;
  format: string;
  updateIntervalHours: number;
  configsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseBackup {
  version: string;
  timestamp: string;
  configs: ParsedProxyConfig[];
  subscriptions: SavedSubscriptionRecord[];
  cleanIps: CleanIpItem[];
  settings: Record<string, any>;
}
