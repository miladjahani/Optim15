import React, { useState } from 'react';
import {
  Globe,
  Play,
  Clock,
  Zap,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CleanIpItem, Language } from '../../types';
import { DEFAULT_CLEAN_IPS } from '../../utils/clean-ips';
import { translations } from '../../i18n';

interface Props {
  lang: Language;
}

export const CleanIpMatrixTab: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [items, setItems] = useState<CleanIpItem[]>(DEFAULT_CLEAN_IPS);
  const [testing, setTesting] = useState(false);
  const [filterOp, setFilterOp] = useState<'all' | 'mci' | 'mtn' | 'rtl' | 'shatel'>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const handleTestAll = async () => {
    setTesting(true);
    const updated = items.map((it) => ({ ...it, status: 'testing' as const, latency: null }));
    setItems(updated);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const start = performance.now();

      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2600);

        await fetch(`https://${it.ip}/cdn-cgi/trace?_t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: ctrl.signal,
          cache: 'no-store'
        }).catch(() => {});

        clearTimeout(tid);
        const duration = Math.round(performance.now() - start);

        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, latency: duration, status: 'success' } : item
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, latency: null, status: 'timeout' } : item
          )
        );
      }
    }
    setTesting(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredItems = items.filter((it) => {
    if (filterOp === 'all') return true;
    return it.operator === filterOp;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">{t.ip_title}</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t.ip_desc}</p>
            </div>
          </div>

          <button
            onClick={handleTestAll}
            disabled={testing}
            className="px-5 py-2.5 bg-amber-400 text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>{t.ip_test_testing}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>{t.ip_test_start}</span>
              </>
            )}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 pt-2 flex-wrap text-xs font-bold">
          <span className="text-slate-400">فیلتر بر اساس اپراتور:</span>
          <button
            onClick={() => setFilterOp('all')}
            className={`px-3 py-1 rounded-xl cursor-pointer ${
              filterOp === 'all' ? 'bg-amber-400 text-black' : 'bg-slate-900 text-slate-300'
            }`}
          >
            همه ({items.length})
          </button>
          <button
            onClick={() => setFilterOp('mci')}
            className={`px-3 py-1 rounded-xl cursor-pointer ${
              filterOp === 'mci' ? 'bg-cyan text-black' : 'bg-slate-900 text-cyan'
            }`}
          >
            همراه اول (MCI)
          </button>
          <button
            onClick={() => setFilterOp('mtn')}
            className={`px-3 py-1 rounded-xl cursor-pointer ${
              filterOp === 'mtn' ? 'bg-amber-400 text-black' : 'bg-slate-900 text-amber-300'
            }`}
          >
            ایرانسل (MTN)
          </button>
          <button
            onClick={() => setFilterOp('rtl')}
            className={`px-3 py-1 rounded-xl cursor-pointer ${
              filterOp === 'rtl' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-purple-300'
            }`}
          >
            رایتل (Rightel)
          </button>
        </div>
      </div>

      {/* Grid of Clean IPs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-amber-400/40 transition-all flex items-center justify-between text-xs"
          >
            <div className="space-y-1 truncate max-w-[170px]">
              <span className="font-bold text-white block truncate">{item.label}</span>
              <span className="font-mono text-cyan text-[11px] block" dir="ltr">
                {item.ip}:{item.port}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.status === 'testing' && <Clock className="w-4 h-4 text-amber-400 animate-spin" />}
              {item.status === 'success' && (
                <span
                  className={`font-black px-2 py-0.5 rounded text-[11px] ${
                    (item.latency || 0) < 180
                      ? 'bg-lime/20 text-lime'
                      : (item.latency || 0) < 320
                      ? 'bg-amber-400/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {item.latency} ms
                </span>
              )}
              {item.status === 'timeout' && (
                <span className="text-slate-500 text-[10px] px-2 py-0.5 bg-slate-900 rounded">Timeout</span>
              )}

              <button
                onClick={() => handleCopy(item.ip)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                title="کپی IP"
              >
                {copiedIp === item.ip ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
