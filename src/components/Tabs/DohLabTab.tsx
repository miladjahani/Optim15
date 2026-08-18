import React, { useState } from 'react';
import {
  Shield,
  Search,
  Copy,
  Check,
  Globe,
  Lock,
  Sparkles,
  Layers,
  FileCode2
} from 'lucide-react';
import { Language, DohQueryResult } from '../../types';
import { DOH_PROVIDERS, queryDoh } from '../../utils/doh-client';
import { translations } from '../../i18n';

interface Props {
  lang: Language;
}

export const DohLabTab: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [domain, setDomain] = useState('speed.cloudflare.com');
  const [selectedProvider, setSelectedProvider] = useState('cf');
  const [querying, setQuerying] = useState(false);
  const [result, setResult] = useState<DohQueryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleQuery = async () => {
    if (!domain.trim()) return;
    setQuerying(true);
    try {
      const res = await queryDoh(domain.trim(), selectedProvider);
      setResult(res);
    } catch (e: any) {
      alert(e.message || 'خطا در استعلام DoH');
    } finally {
      setQuerying(false);
    }
  };

  const getSingboxDnsBlock = (): string => {
    const prov = DOH_PROVIDERS.find((p) => p.id === selectedProvider) || DOH_PROVIDERS[0];
    return JSON.stringify({
      dns: {
        servers: [
          { tag: 'doh-primary', address: prov.url, address_resolver: 'local-dns', detour: 'direct' },
          { tag: 'local-dns', address: 'local', detour: 'direct' }
        ],
        rules: [
          { outbound: 'any', server: 'local-dns' }
        ]
      }
    }, null, 2);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3 text-amber-400">
          <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{t.doh_title}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t.doh_desc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Query Box */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-400" />
            <span>استعلام زنده DNS-over-HTTPS:</span>
          </h3>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">دامنه مورد نظر (Domain):</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="speed.cloudflare.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-400 focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">سرور ریزالور DoH:</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
            >
              {DOH_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleQuery}
            disabled={querying}
            className="w-full py-3 bg-amber-400 text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {querying ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{t.doh_query_btn}</span>
          </button>

          {result && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>زمان پاسخ: <span className="text-lime font-bold">{result.durationMs} ms</span></span>
                <span>TTL: <span className="text-cyan font-bold">{result.ttl}s</span></span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">آی‌پی‌های کشف شده (A Records):</span>
                <div className="space-y-1 pt-1">
                  {result.ips.map((ip, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900 text-lime font-bold rounded block">
                      {ip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sing-Box / Clash Config Generator */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-white">
              پیکربندی خودکار DNS برای Sing-Box:
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(getSingboxDnsBlock());
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 py-1 bg-lime text-black font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? t.copied : t.copy}</span>
            </button>
          </div>

          <div className="flex-1 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-y-auto leading-relaxed" dir="ltr">
            <pre>{getSingboxDnsBlock()}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
