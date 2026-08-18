import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  Copy,
  Check,
  QrCode,
  Sliders,
  Sparkles,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  FileCode2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ParsedProxyConfig, Language, AppTab } from '../../types';
import { translations } from '../../i18n';
import { resolveInputToConfigs, buildOptimizedVlessUri, buildSingBoxJson } from '../../utils/config-parser';
import { saveBatchConfigs } from '../../utils/db';

interface Props {
  lang: Language;
  onOpenQr: (title: string, url: string) => void;
  activeConfigs: ParsedProxyConfig[];
  setActiveConfigs: (cfgs: ParsedProxyConfig[]) => void;
  onNavigateTab: (tab: AppTab) => void;
}

const DEFAULT_CIPHER_SUITES =
  'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256';

const DEFAULT_FINAL_MASK =
  '{"tcp":[{"type":"fragment","settings":{"packets":"tlshello","lengths":["5","94","1"],"delays":["0"],"maxSplit":"0"}},{"type":"fragment","settings":{"packets":"1-1","lengths":["109","1"],"delays":["1"],"maxSplit":"355"}}]}';

export const QuickOptimizerTab: React.FC<Props> = ({
  lang,
  onOpenQr,
  activeConfigs,
  setActiveConfigs,
  onNavigateTab
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Raw Input - Completely empty by default (no hardcoded links!)
  const [inputText, setInputText] = useState('');

  // 2. Advanced Settings (Collapsible)
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [serverAddress, setServerAddress] = useState('');
  const [fingerprint, setFingerprint] = useState<'chrome' | 'firefox' | 'safari' | 'edge' | 'random' | 'unsafe'>('chrome');
  const [cipherSuites, setCipherSuites] = useState(DEFAULT_CIPHER_SUITES);
  const [finalMask, setFinalMask] = useState(DEFAULT_FINAL_MASK);
  const [isFmJsonValid, setIsFmJsonValid] = useState(true);

  // 3. Output State
  const [optimizedOutput, setOptimizedOutput] = useState('');
  const [outputConfigsCount, setOutputConfigsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validate FinalMask JSON on change
  useEffect(() => {
    try {
      if (!finalMask.trim()) {
        setIsFmJsonValid(true);
      } else {
        JSON.parse(finalMask.trim());
        setIsFmJsonValid(true);
      }
    } catch {
      setIsFmJsonValid(false);
    }
  }, [finalMask]);

  // Calculate lines count
  const inputLinesCount = inputText.trim() ? inputText.trim().split(/\r?\n/).filter(Boolean).length : 0;

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInputText(text.trim());
    } catch {
      alert(isFa ? 'دسترسی به کلیپ‌بورد امکان‌پذیر نیست.' : 'Clipboard access denied.');
    }
  };

  const handleClear = () => {
    setInputText('');
    setOptimizedOutput('');
    setOutputConfigsCount(0);
    setErrorMsg('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content.trim());
      }
    };
    reader.readAsText(file);
  };

  // Main Optimization Script (Exact ArasTey Algorithm)
  const handleOptimize = async () => {
    if (!inputText.trim()) {
      setErrorMsg(isFa ? 'لطفاً ابتدا کانفیگ یا لینک سابسکریپشن را وارد کنید.' : 'Please enter configs first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      let content = inputText.trim();

      // Decode Base64 if full string is base64
      if (!content.includes('://') && content.length > 20) {
        try {
          content = decodeURIComponent(escape(atob(content)));
        } catch {
          try { content = atob(content); } catch {}
        }
      }

      // Check if URL feed
      if (content.startsWith('http://') || content.startsWith('https://')) {
        try {
          const res = await fetch(content, { headers: { 'User-Agent': 'v2rayNG/1.8.12' } });
          if (res.ok) {
            const fetched = await res.text();
            if (fetched && fetched.trim().length > 10) {
              content = fetched.trim();
              if (!content.includes('://') && content.length > 20) {
                try { content = decodeURIComponent(escape(atob(content))); } catch {}
              }
            }
          }
        } catch (e) {}
      }

      // Parse lines
      const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const generatedConfigs: string[] = [];
      const parsedListForSync: ParsedProxyConfig[] = [];

      for (const line of rawLines) {
        // 1. VLESS & Trojan Protocols
        if (line.startsWith('vless://') || line.startsWith('trojan://')) {
          try {
            const u = new URL(line);
            const proto = u.protocol;
            const uuid = u.username;
            const originalServer = u.hostname;
            const port = u.port || '443';
            const hash = decodeURIComponent(u.hash ? u.hash.substring(1) : 'Node');
            const searchParams = new URLSearchParams(u.search);

            // Apply Target Server IP/Domain if provided
            const targetServer = serverAddress.trim() || originalServer;

            // Apply Fingerprint
            if (fingerprint && fingerprint !== 'unsafe') {
              searchParams.set('fp', fingerprint);
            }

            // Apply Cipher Suites (cs) if provided
            if (cipherSuites.trim()) {
              searchParams.set('cs', cipherSuites.trim());
            }

            // Apply FinalMask (fm) or Fragment
            if (finalMask.trim()) {
              searchParams.set('fm', finalMask.trim());
            }

            const finalUri = `${proto}//${uuid}@${targetServer}:${port}?${searchParams.toString()}#${encodeURIComponent(hash)}`;
            generatedConfigs.push(finalUri);

            parsedListForSync.push({
              id: Math.random().toString(36).substring(2, 9),
              protocol: proto.replace(':', '') as any,
              uuid,
              server: targetServer,
              port: parseInt(port, 10),
              name: hash,
              transport: (searchParams.get('type') as any) || 'ws',
              security: (searchParams.get('security') as any) || 'tls',
              sni: searchParams.get('sni') || originalServer,
              host: searchParams.get('host') || originalServer,
              path: searchParams.get('path') || '/',
              alpn: searchParams.get('alpn') || 'h2,http/1.1',
              fingerprint: fingerprint || 'chrome',
              earlyData: searchParams.get('ed') || '2048',
              fragmentEnabled: true,
              fragmentLength: '100-200',
              fragmentInterval: '10-20',
              fragmentPackets: '1-3',
              raw: finalUri
            });
          } catch {
            generatedConfigs.push(line);
          }
        }
        // 2. VMess Protocol (Pass-through with optional server replace)
        else if (line.startsWith('vmess://')) {
          try {
            const b64 = line.replace('vmess://', '');
            const vObj = JSON.parse(decodeURIComponent(escape(atob(b64))));
            if (serverAddress.trim()) {
              vObj.add = serverAddress.trim();
            }
            if (fingerprint) vObj.fp = fingerprint;
            const updatedB64 = btoa(unescape(encodeURIComponent(JSON.stringify(vObj))));
            generatedConfigs.push(`vmess://${updatedB64}`);
          } catch {
            generatedConfigs.push(line);
          }
        }
        // 3. Shadowsocks, Hysteria2, TUIC (Pass-through)
        else {
          generatedConfigs.push(line);
        }
      }

      if (generatedConfigs.length > 0) {
        setOptimizedOutput(generatedConfigs.join('\n'));
        setOutputConfigsCount(generatedConfigs.length);

        // Populate global state only AFTER successful generation
        if (parsedListForSync.length > 0) {
          setActiveConfigs(parsedListForSync);
          saveBatchConfigs(parsedListForSync);
        }
      } else {
        setErrorMsg(isFa ? 'هیچ کانفیگ معتبری در ورودی شناسایی نشد.' : 'No valid configs recognized.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بهینه‌سازی');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!optimizedOutput) return;
    navigator.clipboard.writeText(optimizedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!optimizedOutput) return;
    const blob = new Blob([optimizedOutput], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-configs.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    if (!optimizedOutput) return;
    const parsed = resolveInputToConfigs(optimizedOutput);
    parsed.then((cfgs) => {
      const jsonStr = buildSingBoxJson(cfgs);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sing-box-config.json';
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Top Banner Matching ArasTey Header */}
      <div className="glass-card rounded-3xl p-6 sm:p-7 border border-emerald-400/30 shadow-2xl space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>بهینه‌ساز کانفیگ</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 border border-emerald-400/30">
                ArasTey Engine
              </span>
            </h1>
            <p className="text-xs text-slate-300">
              افزودن Fragment، Cipher Suites (`cs`) و FinalMask (`fm`) به کانفیگ‌های VPN
            </p>
          </div>
        </div>

        {/* Windows & iOS Note Box */}
        <div className="p-3.5 bg-emerald-400/10 rounded-2xl border border-emerald-400/25 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-bold">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>دریافت مخصوص ویندوز و iOS:</span>
          </div>
          <span className="text-[11px] text-slate-300">
            iOS: ابتدا حالت عادی، در صورت نیاز JSON — ویندوز: فقط JSON (v2rayN v7.24.7)
          </span>
        </div>
      </div>

      {/* Main Input Card */}
      <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">کانفیگ‌های ورودی</span>
            <span className="font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[10px] border border-slate-800">
              {inputLinesCount} خط
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePaste}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <span>📋 چسباندن</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.json,.data,.dat,.cfg"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-cyan border border-cyan/30 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <span>📁 فایل</span>
            </button>

            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک کردن</span>
            </button>
          </div>
        </div>

        <textarea
          rows={5}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            setErrorMsg('');
          }}
          placeholder="کانفیگ · لینک ساب · کد base64 — همه پشتیبانی می‌شوند"
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-white font-mono text-[11px] focus:border-emerald-400 focus:outline-none leading-relaxed"
          dir="ltr"
        />

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
          <span>فایل .txt · لینک ساب · base64 — بدون محدودیت</span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Big Optimization Button */}
        <button
          onClick={handleOptimize}
          disabled={loading}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm rounded-2xl shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>در حال بهینه‌سازی...</span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-black" />
              <span>بهینه‌سازی</span>
            </>
          )}
        </button>
      </div>

      {/* Advanced Settings (Collapsible Accordion) */}
      <div className="glass-card rounded-3xl border border-white/10 shadow-xl overflow-hidden text-xs">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-5 flex items-center justify-between bg-slate-950/60 hover:bg-slate-900/60 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>تنظیمات پیشرفته</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px] hidden sm:inline">آدرس · Fingerprint · Cipher Suites · FinalMask</span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-6 pt-2 space-y-4 border-t border-slate-800/80 bg-slate-950/40">
            {/* Server Address */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300">
                  آدرس سرور <span className="text-[10px] text-slate-500 font-normal">(اختیاری)</span>
                </label>
                {serverAddress && (
                  <button
                    onClick={() => setServerAddress('')}
                    className="text-rose-400 text-[10px] hover:underline cursor-pointer"
                  >
                    ❌ پاک
                  </button>
                )}
              </div>
              <input
                type="text"
                value={serverAddress}
                onChange={(e) => setServerAddress(e.target.value)}
                placeholder="پیش‌فرض خالی — IP یا دامنهٔ اصلی تغییر نمی‌کند."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 font-mono text-[11px] text-white focus:border-emerald-400 focus:outline-none"
                dir="ltr"
              />
              <span className="text-[10px] text-slate-500 block">پیش‌فرض خالی — IP یا دامنهٔ اصلی تغییر نمی‌کند.</span>
            </div>

            {/* Fingerprint Dropdown */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300">Fingerprint</label>
              <select
                value={fingerprint}
                onChange={(e) => setFingerprint(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:border-emerald-400 focus:outline-none cursor-pointer"
              >
                <option value="chrome">chrome</option>
                <option value="firefox">firefox</option>
                <option value="safari">safari</option>
                <option value="edge">edge</option>
                <option value="random">random</option>
                <option value="unsafe">unsafe</option>
              </select>
              <span className="text-[10px] text-slate-500 block">روی همهٔ کانفیگ‌ها اعمال می‌شود.</span>
            </div>

            {/* Cipher Suites (cs) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">cs</span>
                  <span>Cipher Suites</span>
                </label>
                <button
                  onClick={() => setCipherSuites(DEFAULT_CIPHER_SUITES)}
                  className="text-emerald-400 text-[10px] hover:underline cursor-pointer"
                >
                  بازنشانی پیش‌فرض
                </button>
              </div>
              <textarea
                rows={3}
                value={cipherSuites}
                onChange={(e) => setCipherSuites(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-slate-300 focus:border-emerald-400 focus:outline-none leading-relaxed"
                dir="ltr"
              />
            </div>

            {/* FinalMask (fm) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono text-[10px] rounded">fm</span>
                  <span>FinalMask</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${isFmJsonValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isFmJsonValid ? '✓ JSON معتبر' : '✗ JSON نامعتبر'}
                  </span>
                  <button
                    onClick={() => setFinalMask(DEFAULT_FINAL_MASK)}
                    className="text-emerald-400 text-[10px] hover:underline cursor-pointer"
                  >
                    بازنشانی
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                value={finalMask}
                onChange={(e) => setFinalMask(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-[10px] text-emerald-300 focus:border-emerald-400 focus:outline-none leading-relaxed"
                dir="ltr"
              />
            </div>

            {/* Protocol Badges */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-800/80 text-[10px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                ✦ کامل vless
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-400/10 text-emerald-300 border border-emerald-400/20">
                ✦ کامل trojan
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                ✦ عبور vmess
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                ✦ عبور ss
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                ✦ عبور hysteria2
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800">
                ✦ عبور tuic
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Output Section (Appears after optimization) */}
      {optimizedOutput && (
        <div className="glass-card rounded-3xl p-6 border border-emerald-400/40 shadow-2xl space-y-4 animate-fadeIn text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">خروجی بهینه‌شده</span>
              <span className="font-mono px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                {outputConfigsCount} کانفیگ
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handleCopyAll}
                className="px-3.5 py-1.5 bg-emerald-400 text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all cursor-pointer flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'کپی شد!' : 'کپی همه'}</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold rounded-xl cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود TXT</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold rounded-xl cursor-pointer flex items-center gap-1"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>خروجی JSON</span>
              </button>

              <button
                onClick={() => setOptimizedOutput('')}
                className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl cursor-pointer"
                title="پاک کردن خروجی"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <textarea
            rows={8}
            value={optimizedOutput}
            readOnly
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-cyan font-mono text-[11px] focus:outline-none leading-relaxed break-all"
            dir="ltr"
          />

          {/* Quick Chained Jumps to other tabs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-bold text-xs">
            <button
              onClick={() => onNavigateTab('converter')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔄 باز کردن در مبدل کلاینت‌ها</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateTab('gaming_live_ping')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-cyan border border-cyan/30 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🎮 تست پینگ و سرعت این نودها</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onNavigateTab('sub_link_gen')}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-400/30 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🔗 تبدیل به لینک ساب آنلاین</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
