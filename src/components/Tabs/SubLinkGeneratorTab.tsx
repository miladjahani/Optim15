import React, { useState } from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Share2,
  Globe,
  Lock,
  Layers,
  Sparkles,
  Server,
  UploadCloud,
  FileCode2,
  ExternalLink
} from 'lucide-react';
import { Language, ParsedProxyConfig } from '../../types';
import { translations } from '../../i18n';
import { parseBatchConfigs, buildOptimizedVlessUri, buildSingBoxJson, buildClashMetaYaml } from '../../utils/config-parser';
import { createOrUpdateGistSubscription } from '../../utils/gist-sync';
import { saveSubscription } from '../../utils/db';

interface Props {
  lang: Language;
  onOpenQr: (title: string, url: string) => void;
  activeConfigs: ParsedProxyConfig[];
}

export const SubLinkGeneratorTab: React.FC<Props> = ({ lang, onOpenQr, activeConfigs }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [inputConfigs, setInputConfigs] = useState(() => {
    if (activeConfigs.length > 0) {
      return activeConfigs.map((c) => buildOptimizedVlessUri(c)).join('\n');
    }
    return `vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.16.1.1:443?type=ws&security=tls&path=/stream#🟢-MCI-Fast
vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.17.2.2:443?type=ws&security=tls&path=/stream#🟡-MTN-Fast
vless://351c9981-04b6-4103-aa4b-864aa9c91469@162.159.192.1:443?type=ws&security=tls&path=/stream#🟣-RTL-Fast`;
  });

  const [subTitle, setSubTitle] = useState('⚡ VIP Group Subscription');
  const [updateHours, setUpdateHours] = useState('12');
  const [targetClient, setTargetClient] = useState<'base64' | 'singbox' | 'clash'>('base64');
  
  // GitHub Gist Auto-Sync
  const [ghToken, setGhToken] = useState(() => localStorage.getItem('gh_gist_token') || '');
  const [savedGistId, setSavedGistId] = useState(() => localStorage.getItem('last_gist_id') || '');
  const [generatedSubUrl, setGeneratedSubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLiveLink = async () => {
    setLoading(true);
    try {
      const configs = parseBatchConfigs(inputConfigs);
      if (configs.length === 0) {
        throw new Error(isFa ? 'هیچ کانفیگی برای ساخت سابسکریپشن وارد نشده است' : 'No configs provided');
      }

      let fileContent = '';
      let filename = 'sub.txt';

      if (targetClient === 'singbox') {
        fileContent = buildSingBoxJson(configs);
        filename = 'singbox.json';
      } else if (targetClient === 'clash') {
        fileContent = buildClashMetaYaml(configs);
        filename = 'clash.yaml';
      } else {
        const rawList = configs.map((c) => buildOptimizedVlessUri(c)).join('\n');
        fileContent = btoa(unescape(encodeURIComponent(rawList)));
        filename = 'sub.txt';
      }

      // Save token if provided
      if (ghToken.trim()) {
        localStorage.setItem('gh_gist_token', ghToken.trim());
      }

      // Create or update GitHub Gist
      const res = await createOrUpdateGistSubscription(
        ghToken,
        savedGistId || null,
        filename,
        fileContent,
        `${subTitle} — Updated automatically by CF-Optimizor`
      );

      setSavedGistId(res.gistId);
      localStorage.setItem('last_gist_id', res.gistId);
      setGeneratedSubUrl(res.rawUrl);
      saveSubscription({
        id: res.gistId,
        title: subTitle,
        url: res.rawUrl,
        gistId: res.gistId,
        format: targetClient,
        updateIntervalHours: parseInt(updateHours, 10) || 12,
        configsCount: configs.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      alert(err.message || 'خطا در ساخت لینک اشتراک');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSubUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-lime/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3 text-lime">
          <div className="p-3.5 bg-lime/10 border border-lime/30 rounded-2xl shadow-[0_0_20px_rgba(0,255,136,0.25)]">
            <Link2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>{isFa ? 'استودیو ساخت لینک اشتراک گروهی (با قابلیت بروزرسانی خودکار)' : 'Live Updatable Group Subscription Generator'}</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-lime/20 text-lime border border-lime/30">
                Auto-Sync 🔄
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {isFa
                ? 'کانفیگ‌های خود را به یک لینک اشتراک آنلاین (URL) تبدیل کنید تا به راحتی در برنامه‌های V2RayNG، Sing-Box، Clash و Hiddify اضافه شده و در هر زمان قابل آپدیت باشد.'
                : 'Convert multiple configs into a single live updatable subscription URL for V2RayNG, Sing-Box, and Clash'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Metadata & Input */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-lime" />
            <span>تنظیمات بسته اشتراکی:</span>
          </h3>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">عنوان گروه اشتراکی (Profile Title):</label>
            <input
              type="text"
              value={subTitle}
              onChange={(e) => setSubTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-lime focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 mb-1 font-bold">دوره بروزرسانی خودکار:</label>
              <select
                value={updateHours}
                onChange={(e) => setUpdateHours(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="6">هر ۶ ساعت</option>
                <option value="12">هر ۱۲ ساعت (پیش‌فرض)</option>
                <option value="24">هر ۲۴ ساعت (روزانه)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-bold">فرمت سابسکریپشن:</label>
              <select
                value={targetClient}
                onChange={(e) => setTargetClient(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="base64">Universal Base64 (V2RayNG / Hiddify)</option>
                <option value="singbox">Sing-Box 1.11+ (JSON Profile)</option>
                <option value="clash">Clash Meta / Mihomo (YAML)</option>
              </select>
            </div>
          </div>

          {/* GitHub Token (Optional for Private/Personal Gist) */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">توکن GitHub جهت مدیریت و ویرایش دائمی (اختیاری):</span>
            </div>
            <input
              type="password"
              value={ghToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_... (اختیاری - جهت امکان بروزرسانی لینک قبلی)"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              dir="ltr"
            />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              در صورت خالی گذاشتن، لینک اشتراک به صورت ناشناس و عمومی ایجاد می‌گردد. با وارد کردن توکن، لینک در مراجعات بعدی با همان آدرس آپدیت می‌شود.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-bold">کانفیگ‌های تشکیل‌دهنده گروه:</label>
            <textarea
              rows={6}
              value={inputConfigs}
              onChange={(e) => setInputConfigs(e.target.value)}
              placeholder="کانفیگ‌های خود را خط به خط اینجا قرار دهید..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono text-[11px] focus:border-lime focus:outline-none leading-relaxed"
              dir="ltr"
            />
          </div>

          <button
            onClick={handleGenerateLiveLink}
            disabled={loading}
            className="w-full py-3.5 bg-lime text-black font-black text-xs rounded-2xl hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>در حال ساخت لینک اشتراک پویا...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>{savedGistId ? 'بروزرسانی لینک اشتراک فعلی' : 'ایجاد لینک اشتراک آنلاین (Live Sub URL)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Generated URL & QR Output */}
        <div className="lg:col-span-6 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-sm font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan" />
                <span>لینک اشتراک آنلاین تولیدشده:</span>
              </span>
              {generatedSubUrl && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lime/20 text-lime border border-lime/30 font-bold">
                  Live Online ⚡
                </span>
              )}
            </div>

            {generatedSubUrl ? (
              <div className="space-y-3 animate-fadeIn">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold block">آدرس سابسکریپشن جهت وارد کردن در نرم‌افزارها:</span>
                  <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[11px] text-cyan break-all select-all" dir="ltr">
                    {generatedSubUrl}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2.5 bg-lime text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t.copied : 'کپی لینک سابسکریپشن'}</span>
                  </button>

                  <button
                    onClick={() => onOpenQr(subTitle, generatedSubUrl)}
                    className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-cyan border border-cyan/30 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>نمایش بارکد QR</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs gap-2 text-center p-4">
                <Link2 className="w-8 h-8 text-slate-600" />
                <span>کانفیگ‌های مورد نظرتان را در کادر روبرو قرار دهید و دکمه ایجاد لینک اشتراک را بزنید.</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-300 leading-relaxed">
            <div className="flex items-center gap-1.5 text-lime font-bold">
              <Share2 className="w-4 h-4" />
              <span>نحوه استفاده در کلاینت‌ها (V2RayNG / Hiddify / Sing-Box):</span>
            </div>
            <p className="text-slate-400">
              کافیست لینک ایجاد شده را کپی کرده و در برنامه مورد نظرتان در بخش «افزودن اشتراک / Subscription Group» وارد کنید. برنامه کلاینت با هر بار لمس دکمه بروزرسانی، کانفیگ‌های تازه را به صورت خودکار از این آدرس دریافت خواهد کرد.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
