
export const GITHUB_CLEAN_IP_REPOSITORIES = [
  { name: 'vfarid/v2ray-share', url: 'https://raw.githubusercontent.com/vfarid/v2ray-share/master/ip/clean.txt', desc: 'مخزن معروف vfarid' },
  { name: 'bih-cf-ip/clean-ips', url: 'https://raw.githubusercontent.com/bih-cf-ip/clean-ips/master/clean-ips.txt', desc: 'مخزن آی‌پی‌های تست‌شده bih' },
  { name: 'ircfspace/cf-clean-ips', url: 'https://raw.githubusercontent.com/ircfspace/cf-clean-ips/main/list.json', desc: 'پایگاه اسکن جامعه IR-CF' },
  { name: 'MortezaBashsiz/CFScanner', url: 'https://raw.githubusercontent.com/MortezaBashsiz/CFScanner/main/config/cf.local.iplist', desc: 'مخزن اسکنر بش‌سیز' },
  { name: 'Cloudflare Official Range', url: 'https://www.cloudflare.com/ips-v4', desc: 'رنج‌های رسمی Anycast کلودفلر' }
];

import { CleanIpItem } from '../types';

export const DEFAULT_CLEAN_IPS: CleanIpItem[] = [
  // --- 🟢 همراه اول (MCI) ---
  { ip: '104.16.1.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Anycast Fast 1', latency: null, status: 'idle' },
  { ip: '104.19.241.25', port: 443, operator: 'mci', label: '🟢 همراه اول - Clean Edge 2', latency: null, status: 'idle' },
  { ip: '172.64.155.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Edge Gateway 3', latency: null, status: 'idle' },
  { ip: '104.26.12.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Direct CDN 4', latency: null, status: 'idle' },
  { ip: '198.41.200.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Low Latency Anycast 5', latency: null, status: 'idle' },
  { ip: '104.18.2.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Anycast 6', latency: null, status: 'idle' },
  { ip: '104.21.16.1', port: 443, operator: 'mci', label: '🟢 همراه اول - Edge 7', latency: null, status: 'idle' },

  // --- 🟡 ایرانسل (MTN Irancell) ---
  { ip: '104.17.2.2', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Anycast Fast 1', latency: null, status: 'idle' },
  { ip: '172.67.182.11', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Clean Edge 2', latency: null, status: 'idle' },
  { ip: '104.21.48.1', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Anycast 3', latency: null, status: 'idle' },
  { ip: '104.24.110.1', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Edge Gateway 4', latency: null, status: 'idle' },
  { ip: '172.64.80.1', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Low Ping 5', latency: null, status: 'idle' },
  { ip: '162.158.12.1', port: 443, operator: 'mtn', label: '🟡 ایرانسل - Direct Edge 6', latency: null, status: 'idle' },

  // --- 🟣 رایتل (Rightel) ---
  { ip: '162.159.192.1', port: 443, operator: 'rtl', label: '🟣 رایتل - Direct Anycast 1', latency: null, status: 'idle' },
  { ip: '104.22.65.1', port: 443, operator: 'rtl', label: '🟣 رایتل - CDN Edge 2', latency: null, status: 'idle' },
  { ip: '104.18.22.1', port: 443, operator: 'rtl', label: '🟣 رایتل - Global Anycast 3', latency: null, status: 'idle' },
  { ip: '172.67.140.1', port: 443, operator: 'rtl', label: '🟣 رایتل - Clean IP 4', latency: null, status: 'idle' },

  // --- 🔵 شاتل / مخابرات / آسیاتک (Fixed Broadband) ---
  { ip: '172.67.182.11', port: 443, operator: 'shatel', label: '🔵 مخابرات / شاتل - Clean 1', latency: null, status: 'idle' },
  { ip: '104.16.12.1', port: 443, operator: 'shatel', label: '🔵 مخابرات / شاتل - Fast 2', latency: null, status: 'idle' },
  { ip: '198.41.200.1', port: 443, operator: 'shatel', label: '🔵 مخابرات / شاتل - Anycast 3', latency: null, status: 'idle' },
  { ip: '104.20.10.1', port: 443, operator: 'shatel', label: '🔵 آسیاتک / زیتل - Clean 4', latency: null, status: 'idle' },

  // --- 🤖 آی‌پی و پراکسی ثابت برای هوش مصنوعی (Claude / Gemini / ChatGPT / OpenAI) ---
  { ip: 'www.visa.com.sg', port: 443, operator: 'ai_proxyip', label: '🤖 ProxyIP Singapore (Visa) - آنلاک کلود و جمنی', latency: null, status: 'idle' },
  { ip: 'ip.sb', port: 443, operator: 'ai_proxyip', label: '🤖 ProxyIP Global (IP.SB) - آنلاک چت‌جی‌پی‌تی', latency: null, status: 'idle' },
  { ip: 'cdn.jsdelivr.net', port: 443, operator: 'ai_proxyip', label: '🤖 ProxyIP Fast CDN (jsDelivr) - مناسب AI', latency: null, status: 'idle' },
  { ip: 'workers.cloudflare.com', port: 443, operator: 'ai_proxyip', label: '🤖 ProxyIP Worker Relay - خروجی آزاد', latency: null, status: 'idle' },
  { ip: '104.16.24.4', port: 443, operator: 'ai_proxyip', label: '🤖 ProxyIP Clean Anycast - آی‌پی ثابت هوش مصنوعی', latency: null, status: 'idle' },

  // --- ⚡ Fastly CDN & Global Edge ---
  { ip: '151.101.1.69', port: 443, operator: 'fastly', label: '⚡ Fastly CDN - Primary Edge', latency: null, status: 'idle' },
  { ip: '151.101.65.69', port: 443, operator: 'fastly', label: '⚡ Fastly CDN - Global Edge', latency: null, status: 'idle' },
  { ip: 'speed.cloudflare.com', port: 443, operator: 'global', label: '⚡ Cloudflare SpeedTest Europe', latency: null, status: 'idle' },
  { ip: 'icook.hk', port: 443, operator: 'global', label: '⚡ Direct Anycast HK Edge', latency: null, status: 'idle' }
];

export const CLOUDFLARE_CIDR_BLOCKS = [
  { label: '104.16.0.0/13 (Anycast Range 1)', cidr: '104.16.0.0/13', base: '104.16' },
  { label: '104.24.0.0/14 (Anycast Range 2)', cidr: '104.24.0.0/14', base: '104.24' },
  { label: '162.158.0.0/15 (Direct Edge CDN)', cidr: '162.158.0.0/15', base: '162.159' },
  { label: '172.64.0.0/13 (Edge Gateway)', cidr: '172.64.0.0/13', base: '172.64' },
  { label: '188.114.96.0/20 (Europe Edge)', cidr: '188.114.96.0/20', base: '188.114' },
  { label: '198.41.128.0/17 (Tier 1 Backbone)', cidr: '198.41.128.0/17', base: '198.41' }
];
