import React, { useState } from 'react';
import {
  Layers,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Filter,
  ArrowDownAZ,
  Smile,
  Shield
} from 'lucide-react';
import { Language, ParsedProxyConfig } from '../../types';
import { translations } from '../../i18n';
import { parseBatchConfigs, buildOptimizedVlessUri } from '../../utils/config-parser';

interface Props {
  lang: Language;
}

export const BatchSubCleanerTab: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [inputSub, setInputSub] = useState(
    `vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.16.1.1:443?type=ws&security=tls#Node-1
vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.16.1.1:443?type=ws&security=tls#Duplicate-Node
vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.17.2.2:443?type=ws&security=tls#Node-2`
  );

  const [cleanedOutput, setCleanedOutput] = useState('');
  const [stats, setStats] = useState<{ total: number; unique: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClean = (addEmojis = true) => {
    const list = parseBatchConfigs(inputSub);
    const seen = new Set<string>();
    const uniqueList: ParsedProxyConfig[] = [];

    for (const item of list) {
      const key = `${item.protocol}:${item.server}:${item.port}:${item.path}:${item.host}`;
      if (!seen.has(key)) {
        seen.add(key);
        let finalName = item.name;
        if (addEmojis) {
          if (item.server.startsWith('104.16')) finalName = `🟢 [MCI] ${item.name} ⚡`;
          else if (item.server.startsWith('104.17')) finalName = `🟡 [MTN] ${item.name} ⚡`;
          else if (item.server.startsWith('162.159')) finalName = `🟣 [RTL] ${item.name} ⚡`;
          else finalName = `⚡ [CF] ${item.name}`;
        }
        uniqueList.push({ ...item, name: finalName, fragmentEnabled: true });
      }
    }

    setStats({ total: list.length, unique: uniqueList.length });
    const outputUris = uniqueList.map((c) => buildOptimizedVlessUri(c)).join('\n');
    setCleanedOutput(outputUris);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-400/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-3 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{t.batch_title}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t.batch_desc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs flex flex-col">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">ورودی کانفیگ‌های نامرتب:</span>
            <button
              onClick={() => setInputSub('')}
              className="text-rose-400 hover:underline cursor-pointer text-[11px]"
            >
              پاک‌سازی
            </button>
          </div>

          <textarea
            rows={10}
            value={inputSub}
            onChange={(e) => setInputSub(e.target.value)}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white font-mono text-[11px] focus:border-emerald-400 focus:outline-none leading-relaxed"
            dir="ltr"
          />

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => handleClean(true)}
              className="flex-1 py-2.5 bg-emerald-400 text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>حذف تکراری‌ها + برچسب اپراتور</span>
            </button>
            <button
              onClick={() => handleClean(false)}
              className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              ساده
            </button>
          </div>
        </div>

        {/* Right Cleaned Output */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="space-x-2">
              <span className="font-bold text-slate-300">نتیجه پاک‌سازی شده:</span>
              {stats && (
                <span className="text-[11px] font-mono text-lime bg-lime/10 px-2 py-0.5 rounded">
                  {stats.unique} نود یکتا از {stats.total}
                </span>
              )}
            </div>

            <button
              onClick={handleCopy}
              disabled={!cleanedOutput}
              className="flex items-center gap-1 px-3 py-1.5 bg-lime text-black font-black text-xs rounded-xl hover:shadow-[0_0_12px_rgba(0,255,136,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.copied : t.copy}</span>
            </button>
          </div>

          <div className="flex-1 bg-slate-950 p-3.5 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-300 max-h-[300px] overflow-y-auto leading-relaxed" dir="ltr">
            {cleanedOutput ? (
              <pre className="whitespace-pre-wrap break-all">{cleanedOutput}</pre>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-500 font-sans text-xs">
                برای پاک‌سازی روی دکمه شروع کلیک کنید...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
