import { ParsedProxyConfig, SavedSubscriptionRecord, CleanIpItem, DatabaseBackup } from '../types';

const DB_CONFIGS_KEY = 'cf_opt_db_configs';
const DB_SUBS_KEY = 'cf_opt_db_subscriptions';
const DB_IPS_KEY = 'cf_opt_db_clean_ips';
const DB_SETTINGS_KEY = 'cf_opt_db_settings';

// --- CONFIGS CRUD ---
export function getSavedConfigs(): ParsedProxyConfig[] {
  try {
    const raw = localStorage.getItem(DB_CONFIGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConfig(config: ParsedProxyConfig): ParsedProxyConfig[] {
  const current = getSavedConfigs();
  const index = current.findIndex((c) => c.id === config.id);
  const itemToSave = {
    ...config,
    createdAt: config.createdAt || new Date().toISOString()
  };

  if (index >= 0) {
    current[index] = itemToSave;
  } else {
    current.unshift(itemToSave);
  }

  localStorage.setItem(DB_CONFIGS_KEY, JSON.stringify(current));
  return current;
}

export function saveBatchConfigs(configs: ParsedProxyConfig[]): ParsedProxyConfig[] {
  const current = getSavedConfigs();
  const seenIds = new Set(current.map((c) => c.id));

  for (const c of configs) {
    if (!seenIds.has(c.id)) {
      current.unshift({ ...c, createdAt: c.createdAt || new Date().toISOString() });
      seenIds.add(c.id);
    }
  }

  localStorage.setItem(DB_CONFIGS_KEY, JSON.stringify(current));
  return current;
}

export function deleteConfig(id: string): ParsedProxyConfig[] {
  const current = getSavedConfigs().filter((c) => c.id !== id);
  localStorage.setItem(DB_CONFIGS_KEY, JSON.stringify(current));
  return current;
}

// --- SUBSCRIPTIONS CRUD ---
export function getSavedSubscriptions(): SavedSubscriptionRecord[] {
  try {
    const raw = localStorage.getItem(DB_SUBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubscription(sub: SavedSubscriptionRecord): SavedSubscriptionRecord[] {
  const current = getSavedSubscriptions();
  const index = current.findIndex((s) => s.id === sub.id || s.url === sub.url);

  if (index >= 0) {
    current[index] = { ...sub, updatedAt: new Date().toISOString() };
  } else {
    current.unshift(sub);
  }

  localStorage.setItem(DB_SUBS_KEY, JSON.stringify(current));
  return current;
}

export function deleteSubscription(id: string): SavedSubscriptionRecord[] {
  const current = getSavedSubscriptions().filter((s) => s.id !== id);
  localStorage.setItem(DB_SUBS_KEY, JSON.stringify(current));
  return current;
}

// --- CLEAN IPS CACHE ---
export function getCachedCleanIps(): CleanIpItem[] {
  try {
    const raw = localStorage.getItem(DB_IPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function cacheCleanIps(ips: CleanIpItem[]) {
  localStorage.setItem(DB_IPS_KEY, JSON.stringify(ips));
}

// --- BACKUP & RESTORE ---
export function exportDatabaseBackup(): string {
  const backup: DatabaseBackup = {
    version: '5.5.0',
    timestamp: new Date().toISOString(),
    configs: getSavedConfigs(),
    subscriptions: getSavedSubscriptions(),
    cleanIps: getCachedCleanIps(),
    settings: {
      lang: localStorage.getItem('cf_opt_lang') || 'fa',
      theme: localStorage.getItem('cf_opt_theme') || 'dark',
      gistToken: localStorage.getItem('gh_gist_token') || ''
    }
  };
  return JSON.stringify(backup, null, 2);
}

export function importDatabaseBackup(jsonStr: string): boolean {
  try {
    const data: DatabaseBackup = JSON.parse(jsonStr);
    if (data.configs) localStorage.setItem(DB_CONFIGS_KEY, JSON.stringify(data.configs));
    if (data.subscriptions) localStorage.setItem(DB_SUBS_KEY, JSON.stringify(data.subscriptions));
    if (data.cleanIps) localStorage.setItem(DB_IPS_KEY, JSON.stringify(data.cleanIps));
    if (data.settings?.gistToken) localStorage.setItem('gh_gist_token', data.settings.gistToken);
    return true;
  } catch {
    return false;
  }
}

export function clearDatabase() {
  localStorage.removeItem(DB_CONFIGS_KEY);
  localStorage.removeItem(DB_SUBS_KEY);
  localStorage.removeItem(DB_IPS_KEY);
}

// --- OBFUSCATED .DATA EXPORT & IMPORT ---
const OBF_MAGIC = 'EXMU_CFG_v5';

export function exportObfuscatedData(): string {
  const rawJson = exportDatabaseBackup();
  const encoded = btoa(unescape(encodeURIComponent(rawJson)));
  // XOR Obfuscation with dynamic token
  let scrambled = '';
  const key = 'tMmm2n87w9ju43x2v0tBEpWkyPkTl5Kd';
  for (let i = 0; i < encoded.length; i++) {
    scrambled += String.fromCharCode(encoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(scrambled);
}

export function importObfuscatedData(dataStr: string): boolean {
  try {
    const rawScrambled = atob(dataStr.trim());
    const key = 'tMmm2n87w9ju43x2v0tBEpWkyPkTl5Kd';
    let decodedB64 = '';
    for (let i = 0; i < rawScrambled.length; i++) {
      decodedB64 += String.fromCharCode(rawScrambled.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    const jsonStr = decodeURIComponent(escape(atob(decodedB64)));
    return importDatabaseBackup(jsonStr);
  } catch {
    // If plain json fallback
    return importDatabaseBackup(dataStr);
  }
}
