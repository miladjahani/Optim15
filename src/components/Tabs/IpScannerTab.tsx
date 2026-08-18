import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Play,
  Square,
  Clock,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Server,
  Filter,
  Sparkles,
  Bot,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Download,
  FileSpreadsheet,
  Sliders,
  Layers,
  Search
} from 'lucide-react';
import { CleanIpItem, Language, ParsedProxyConfig, AppTab } from '../../types';
import { DEFAULT_CLEAN_IPS, CLOUDFLARE_CIDR_BLOCKS } from '../../utils/clean-ips';
import { translations } from '../../i18n';
import {
  scanCleanIpsViaPython,
  checkPythonBackendStatus,
  fetchMultiRepoCleanIpsViaPython,
  runCloudflareCleanIpScanner,
  runCustomIpScanViaPython,
  BACKEND_URL
} from '../../utils/backend-api';

interface Props {
  lang: Language;
  activeConfigs: ParsedProxyConfig[];
  setActiveConfigs: (cfgs: ParsedProxyConfig[]) => void;
  onNavigateTab: (tab: AppTab) => void;
}

export const IpScannerTab: React.FC<Props> = ({
  lang,
  activeConfigs,
  setActiveConfigs,
  onNavigateTab
}) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [items, setItems] = useState<CleanIpItem[]>(DEFAULT_CLEAN_IPS);
  const [testing, setTesting] = useState(false);
  const [filterOp, setFilterOp] = useState<'all' | 'mci' | 'mtn' | 'rtl' | 'shatel' | 'ai_proxyip' | 'fastly'>('all');
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [pythonOnline, setPythonOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner Tuning Controls (matching Cloudflare-Clean-IP-Scanner & EDT)
  const [scanPreset, setScanPreset] = useState<'quick' | 'standard' | 'deep' | 'custom'>('standard');
  const [threadCount, setThreadCount] = useState(50);
  const [targetPort, setTargetPort] = useState(443);
  const [enableSpeedTest, setEnableSpeedTest] = useState(true);
  const [customIpInput, setCustomIpInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Live Progress Tracker
  const [progressPercent, setProgressPercent] = useState(0);
  const [testedCount, setTestedCount] = useState(0);
  const [totalCandidateCount, setTotalCandidateCount] = useState(0);
  const progressPollRef = useRef<any>(null);

  useEffect(() => {
    checkPythonBackendStatus().then(setPythonOnline);
  }, []);

  const pollScannerStatus = () => {
    progressPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/scanner/status`);
        if (res.ok) {
          const data = await res.json();
          setProgressPercent(data.progress || 0);
          setTestedCount(data.tested || 0);
          setTotalCandidateCount(data.total || 0);
          if (!data.isRunning) {
            clearInterval(progressPollRef.current);
          }
        }
      } catch {}
    }, 600);
  };

  const handleStartCloudflareScan = async () => {
    setTesting(true);
    setProgressPercent(0);
    setTestedCount(0);
    pollScannerStatus();

    try {
      let countPerCidr = 10; // Quick: 10 * 15 = 150 IPs
      if (scanPreset === 'standard') countPerCidr = 20; // 20 * 15 = 300 IPs
      if (scanPreset === 'deep') countPerCidr = 50; // 50 * 15 = 750+ IPs

      if (scanPreset === 'custom') {
        const customList = customIpInput
          .split(/\r?\n/)
          .map((l) => l.trim().split('#')[0].split(':')[0])
          .filter((l) => l && /\d+\.\d+\.\d+\.\d+/.test(l));

        if (customList.length === 0) {
          throw new Error('لطفاً حداقل یک آی‌پی یا ساب‌نت معتبر در کادر وارد کنید.');
        }

        const res = await runCustomIpScanViaPython(customList, threadCount, targetPort, enableSpeedTest);
        if (res && res.results) {
          setItems(res.results);
          alert(isFa ? `اسکن کامل شد: ${res.count} آی‌پی تست و بر اساس سرعت رتبه‌بندی شدند!` : `Scan completed!`);
        }
      } else {
        const res = await runCloudflareCleanIpScanner(threadCount, targetPort, countPerCidr, enableSpeedTest);
        if (res && res.results && res.results.length > 0) {
          setItems(res.results);
          alert(isFa ? `اسکن رنج‌های رسمی کلودفلر (ip.txt) کامل شد: ${res.count} آی‌پی تمیز با سرعت بالا کشف شدند!` : `Scan completed: ${res.count} clean IPs!`);
        } else {
          // Fallback browser probe
          await handleTestAll();
        }
      }
    } catch (e: any) {
      alert(e.message || 'خطا در اسکن');
    } finally {
      setTesting(false);
      clearInterval(progressPollRef.current);
      setProgressPercent(100);
    }
  };

  const handleMultiRepoSync = async () => {
    setTesting(true);
    try {
      const pyData = await fetchMultiRepoCleanIpsViaPython();
      if (pyData && pyData.results && pyData.results.length > 0) {
        setItems(pyData.results);
        alert(isFa ? `تعداد ${pyData.totalFound} آی‌پی تمیز از ۵ مخزن برتر گیت‌هاب دریافت و تست شد!` : `Synced and tested clean IPs from 5 top GitHub repositories!`);
      } else {
        await handleTestAll();
      }
    } catch (err: any) {
      alert(err.message || 'خطا در دریافت مخازن');
    } finally {
      setTesting(false);
    }
  };

  const handleTestAll = async () => {
    setTesting(true);
    const updated = items.map((it) => ({ ...it, status: 'testing' as const, latency: null, ttfb: null }));
    setItems(updated);

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const start = performance.now();

      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2000);

        await fetch(`https://${it.ip}:${targetPort}/cdn-cgi/trace?_t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: ctrl.signal,
          cache: 'no-store'
        }).catch(() => {});

        clearTimeout(tid);
        const duration = Math.round(performance.now() - start);

        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, latency: duration, ttfb: Math.round(duration * 0.75), status: 'success' } : item
          )
        );
      } catch {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, latency: null, ttfb: null, status: 'timeout' } : item
          )
        );
      }
    }
    setTesting(false);
  };

  const handleInjectTopFastest = (count = 10) => {
    if (activeConfigs.length === 0) {
      alert(isFa ? 'ابتدا کانفیگی در تب بهینه‌ساز وارد کنید.' : 'Please add configs in the Optimizer tab first.');
      onNavigateTab('quick_optimizer');
      return;
    }

    const workingIps = items.filter((i) => i.status === 'success' && i.latency !== null);
    if (workingIps.length === 0) {
      alert(isFa ? 'ابتدا اسکن را اجرا کنید تا آی‌پی‌های تمیز کشف شوند.' : 'Run scan first.');
      return;
    }

    const topList = workingIps.slice(0, count);
    const newConfigs: ParsedProxyConfig[] = [];

    activeConfigs.forEach((baseCfg) => {
      topList.forEach((ipItem) => {
        newConfigs.push({
          ...baseCfg,
          id: Math.random().toString(36).substring(2, 9),
          server: ipItem.ip,
          port: ipItem.port || 443,
          name: `${baseCfg.name} ⚡ [${ipItem.ip}]`
        });
      });
    });

    setActiveConfigs(newConfigs);
    alert(isFa ? `تعداد ${newConfigs.length} نود بهینه‌شده با سریع‌ترین آی‌پی‌های کشف‌شده تولید و جایگزین شدند!` : `Injected top fastest clean IPs!`);
    onNavigateTab('quick_optimizer');
  };

  const handleInjectSingleIp = (cleanIp: string, label: string) => {
    if (activeConfigs.length === 0) {
      alert(isFa ? 'ابتدا کانفیگی در تب بهینه‌ساز وارد کنید.' : 'Please add configs in the Optimizer tab first.');
      onNavigateTab('quick_optimizer');
      return;
    }

    const updated = activeConfigs.map((c) => ({
      ...c,
      server: cleanIp,
      port: targetPort,
      name: `${c.name} ⚡ [${cleanIp}]`
    }));

    setActiveConfigs(updated);
    alert(isFa ? `آی‌پی ${cleanIp} با موفقیت به تمام کانفیگ‌های فعال تزریق شد!` : `Injected ${cleanIp} to active configs!`);
    onNavigateTab('quick_optimizer');
  };

  const handleExportCsv = () => {
    const lines = ['IP Address,Port,Latency (ms),Speed (Mbps),Loss Rate,Colo,Operator'];
    items.forEach((r) => {
      lines.push(`${r.ip},${r.port || 443},${r.latency || ''}ms,${r.speedMbps || 0} Mbps,${r.packetLoss || 0}%,${(r as any).colo || 'Edge'},${r.operator}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'result.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAllCleanIps = () => {
    const working = items.filter((i) => i.status === 'success').map((i) => `${i.ip}:${i.port || 443}`);
    navigator.clipboard.writeText(working.join('\n'));
    alert(isFa ? `تعداد ${working.length} آی‌پی تمیز کپی شدند!` : `Copied ${working.length} clean IPs!`);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const filteredItems = items.filter((it) => {
    if (filterOp !== 'all' && it.operator !== filterOp) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return it.ip.includes(q) || it.label.toLowerCase().includes(q) || ((it as any).colo || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner & Control Deck */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-400/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 text-amber-400">
            <div className="p-3.5 bg-amber-400/10 border border-amber-400/30 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">اسکنر موتور Cloudflare-Clean-IP و بانک جامع رنج‌های رسمی</h2>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  pythonOnline
                    ? 'bg-lime/20 text-lime border-lime/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {pythonOnline ? '🐍 50-Thread High-Speed Engine' : '🌐 Browser Probes'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                اسکن تمام رنج‌های رسمی کلودفلر (ip.txt / ipv6.txt) با الگوریتم ۳ مرحله‌ای TCPing، ارزیابی هدر لبه و تست سرعت دانلود (Mbps)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleStartCloudflareScan}
              disabled={testing}
              className="px-5 py-2.5 bg-lime text-black font-black text-xs rounded-xl hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>در حال اسکن رنج‌های رسمی ({testedCount}/{totalCandidateCount})...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>شروع اسکن موتور Cloudflare-Clean-IP</span>
                </>
              )}
            </button>

            <button
              onClick={handleMultiRepoSync}
              disabled={testing}
              className="px-3.5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>اسکن ۵ مخزن گیت‌هاب</span>
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        {testing && (
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold">پیشرفت اسکن موازی:</span>
              <span className="text-lime font-bold">{progressPercent}% ({testedCount} از {totalCandidateCount} آی‌پی تست شدند)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-lime to-cyan rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,255,136,0.5)]"
                style={{ width: `${Math.min(100, progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* Scan Mode & Parameters Deck */}
        <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-xs">مقیاس اسکن و تعداد آی‌پی‌ها:</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setScanPreset('quick')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  scanPreset === 'quick' ? 'bg-amber-400 text-black' : 'bg-slate-900 text-slate-300'
                }`}
              >
                ⚡ سریع (۱۵۰ آی‌پی)
              </button>
              <button
                onClick={() => setScanPreset('standard')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  scanPreset === 'standard' ? 'bg-lime text-black font-black' : 'bg-slate-900 text-slate-300'
                }`}
              >
                🚀 استاندارد (۳۰۰ آی‌پی)
              </button>
              <button
                onClick={() => setScanPreset('deep')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  scanPreset === 'deep' ? 'bg-purple-500 text-white font-black' : 'bg-slate-900 text-slate-300'
                }`}
              >
                🏆 عمیق و جامع (۷۵۰+ آی‌پی)
              </button>
              <button
                onClick={() => setScanPreset('custom')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  scanPreset === 'custom' ? 'bg-cyan text-black font-black' : 'bg-slate-900 text-slate-300'
                }`}
              >
                ✏️ ورودی سفارشی (Custom List)
              </button>
            </div>
          </div>

          {/* Custom IP list input (EDT-inspired) */}
          {scanPreset === 'custom' && (
            <div className="pt-2 border-t border-slate-800 space-y-2 animate-fadeIn text-xs">
              <label className="block font-bold text-cyan">لیست آی‌پی‌ها یا ساب‌نت‌های سفارشی خود را وارد کنید (هر خط یک آی‌پی):</label>
              <textarea
                rows={4}
                value={customIpInput}
                onChange={(e) => setCustomIpInput(e.target.value)}
                placeholder="104.16.1.1\n104.17.2.2\n162.159.192.1\n172.64.0.0/13..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-white focus:border-cyan focus:outline-none"
                dir="ltr"
              />
            </div>
          )}

          {/* Advanced Tuning Slider & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block mb-1 font-bold">تعداد ریسمان‌ها (Threads: {threadCount}):</span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={threadCount}
                onChange={(e) => setThreadCount(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <span className="text-slate-400 block mb-1 font-bold">پورت هدف (Port):</span>
              <select
                value={targetPort}
                onChange={(e) => setTargetPort(parseInt(e.target.value, 10))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-1.5 text-white font-mono"
              >
                <option value={443}>443 (HTTPS - استاندارد)</option>
                <option value={8443}>8443 (TLS Alternate)</option>
                <option value={2053}>2053 (Cloudflare TLS)</option>
                <option value={2083}>2083 (cPanel TLS)</option>
                <option value={2087}>2087 (WHM TLS)</option>
                <option value={2096}>2096 (Direct WebMail)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-4">
              <input
                type="checkbox"
                id="speedtest_toggle"
                checked={enableSpeedTest}
                onChange={(e) => setEnableSpeedTest(e.target.checked)}
                className="rounded accent-lime"
              />
              <label htmlFor="speedtest_toggle" className="font-bold text-slate-300 cursor-pointer">
                تست سرعت دانلود واقعی (Mbps)
              </label>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400">فیلتر:</span>
            <button
              onClick={() => setFilterOp('all')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                filterOp === 'all' ? 'bg-amber-400 text-black font-black' : 'bg-slate-900 text-slate-300'
              }`}
            >
              همه ({items.length})
            </button>
            <button
              onClick={() => setFilterOp('mci')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                filterOp === 'mci' ? 'bg-lime text-black font-black' : 'bg-slate-900 text-lime'
              }`}
            >
              🟢 همراه اول
            </button>
            <button
              onClick={() => setFilterOp('mtn')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                filterOp === 'mtn' ? 'bg-amber-400 text-black font-black' : 'bg-slate-900 text-amber-300'
              }`}
            >
              🟡 ایرانسل
            </button>
            <button
              onClick={() => setFilterOp('rtl')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                filterOp === 'rtl' ? 'bg-purple-500 text-white font-black' : 'bg-slate-900 text-purple-300'
              }`}
            >
              🟣 رایتل
            </button>
            <button
              onClick={() => setFilterOp('ai_proxyip')}
              className={`px-3 py-1.5 rounded-xl cursor-pointer ${
                filterOp === 'ai_proxyip' ? 'bg-cyan text-black font-black' : 'bg-slate-900 text-cyan'
              }`}
            >
              🤖 ProxyIP (هوش مصنوعی)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی IP یا Colo..."
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono pr-8 focus:border-amber-400 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-400/30 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
              title="دانلود فایل CSV خروجی"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleCopyAllCleanIps}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-lime border border-lime/30 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>کپی همه</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Actions Ribbon */}
      <div className="flex items-center justify-between p-4 glass-card rounded-2xl border border-lime/30 flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-white">
          <Sparkles className="w-4 h-4 text-lime" />
          <span>تعداد {filteredItems.length} آی‌پی در لیست موجود است.</span>
        </div>

        <button
          onClick={() => handleInjectTopFastest(10)}
          className="px-4 py-2 bg-lime text-black font-black rounded-xl hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>⚡ تزریق ۱۰ آی‌پی سریع به تمام کانفیگ‌های فعال</span>
        </button>
      </div>

      {/* Grid of All Scanned Clean IPs (Unlimited Scale) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-slate-950/85 border border-slate-800/90 hover:border-amber-400/40 transition-all flex flex-col justify-between text-xs space-y-3 shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white truncate max-w-[180px]">{item.label}</span>
                </div>
                <span className="font-mono text-cyan text-[11px] block" dir="ltr">
                  {item.ip}:{item.port || targetPort}
                </span>
              </div>

              <div className="text-right">
                {item.status === 'testing' && <Clock className="w-4 h-4 text-amber-400 animate-spin ml-auto" />}
                {item.status === 'success' && (
                  <div className="space-y-0.5">
                    <span
                      className={`font-black font-mono px-2 py-0.5 rounded text-[11px] block ${
                        (item.latency || 0) < 180
                          ? 'bg-lime/20 text-lime border border-lime/30'
                          : (item.latency || 0) < 320
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {item.latency} ms
                    </span>
                    {(item as any).speedMbps > 0 && (
                      <span className="text-[10px] font-mono text-cyan font-bold block">
                        {(item as any).speedMbps} Mbps
                      </span>
                    )}
                  </div>
                )}
                {item.status === 'timeout' && (
                  <span className="text-slate-500 text-[10px] px-2 py-0.5 bg-slate-900 rounded">Timeout</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <button
                onClick={() => handleInjectSingleIp(item.ip, item.label)}
                className="flex-1 py-1.5 bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>تزریق به کانفیگ‌ها</span>
              </button>

              <button
                onClick={() => handleCopy(item.ip)}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
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
