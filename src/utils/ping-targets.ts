export interface LivePingTarget {
  id: string;
  name: string;
  category: 'gaming' | 'web' | 'dns' | 'streaming';
  host: string;
  icon: string;
  description: string;
  currentPing: number | null;
  minPing: number | null;
  maxPing: number | null;
  avgPing: number | null;
  jitter: number | null;
  packetLoss: number;
  history: number[];
  status: 'idle' | 'testing' | 'success' | 'timeout';
}

export const LIVE_PING_TARGETS: LivePingTarget[] = [
  // --- 🎮 GAMING & CALL OF DUTY SERVERS ---
  {
    id: 'cod_activision',
    name: 'Call of Duty (Activision / Demonware)',
    category: 'gaming',
    host: 'activision.com',
    icon: '🎮',
    description: 'سرورهای اصلی آنلاین و مچ‌میکینگ Call of Duty',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'blizzard_eu',
    name: 'Battle.net / Blizzard EU',
    category: 'gaming',
    host: 'battle.net',
    icon: '⚔️',
    description: 'سرورهای اروپایی بلیزارد و وارزون',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'steam_valve',
    name: 'Steam Community & CS2 (Valve)',
    category: 'gaming',
    host: 'steamcommunity.com',
    icon: '🎯',
    description: 'سرورهای استیم، کانتراسترایک ۲ و دوتا ۲',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'epic_fortnite',
    name: 'Epic Games & Fortnite',
    category: 'gaming',
    host: 'epicgames.com',
    icon: '🏆',
    description: 'سرورهای فورتنایت و مچ‌میکینگ اپیک‌گیمز',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'riot_valorant',
    name: 'Riot Games (Valorant / LoL)',
    category: 'gaming',
    host: 'riotgames.com',
    icon: '💥',
    description: 'سرورهای ولورانت و لیگ آف لجندز',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'ea_fifa',
    name: 'EA Services & FIFA / Apex',
    category: 'gaming',
    host: 'ea.com',
    icon: '⚽',
    description: 'سرورهای آنلاین EA FC، فیفا و اپکس لجندز',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'discord_voice',
    name: 'Discord Voice & Gateway',
    category: 'gaming',
    host: 'discord.com',
    icon: '🎙️',
    description: 'سرورهای صوتی و چت آنلاین دیسکورد',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },

  // --- 🌐 POPULAR WEB & SOCIAL ---
  {
    id: 'google_main',
    name: 'Google Search & Services',
    category: 'web',
    host: 'google.com',
    icon: '🔍',
    description: 'سرویس‌های ابری و جستجوی گوگل',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'youtube_stream',
    name: 'YouTube Video CDN',
    category: 'streaming',
    host: 'youtube.com',
    icon: '▶️',
    description: 'سرورهای استریم ویدیو و ترافیک یوتیوب',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'telegram_web',
    name: 'Telegram Web CDN',
    category: 'web',
    host: 'web.telegram.org',
    icon: '✈️',
    description: 'سرورهای لبه وب تلگرام و پیام‌رسانی',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'instagram_meta',
    name: 'Instagram / Meta CDN',
    category: 'web',
    host: 'instagram.com',
    icon: '📸',
    description: 'سرورهای تحویل محتوای اینستاگرام و متا',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'github_core',
    name: 'GitHub Core & Raw API',
    category: 'web',
    host: 'github.com',
    icon: '🐙',
    description: 'مخازن و API توسعه‌دهندگان گیت‌هاب',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },

  // --- ⚡ DNS & INFRASTRUCTURE ---
  {
    id: 'cloudflare_speed',
    name: 'Cloudflare SpeedTest Edge',
    category: 'dns',
    host: 'speed.cloudflare.com',
    icon: '⚡',
    description: 'لبه Anycast و سنجش تاخیر کلودفلر',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'cloudflare_doh',
    name: 'Cloudflare 1.1.1.1 (DoH)',
    category: 'dns',
    host: '1.1.1.1',
    icon: '🛡️',
    description: 'دی‌ان‌اس پرسرعت ۱.۱.۱.۱',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'shecan_dns',
    name: 'Shecan Anti-Sanction',
    category: 'dns',
    host: 'shecan.ir',
    icon: '🇮🇷',
    description: 'دی‌ان‌اس ضدتحریم شکن',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  },
  {
    id: 'electro_dns',
    name: 'Electro Gaming DNS',
    category: 'dns',
    host: 'electrotm.org',
    icon: '⚡',
    description: 'دی‌ان‌اس مخصوص بازی الکترو',
    currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
  }
];
