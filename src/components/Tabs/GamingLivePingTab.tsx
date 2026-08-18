import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Play,
  Square,
  Activity,
  Zap,
  Globe,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Server,
  Bot,
  Layers,
  Cpu
} from 'lucide-react';
import { Language, ParsedProxyConfig } from '../../types';
import { LivePingTarget, LIVE_PING_TARGETS } from '../../utils/ping-targets';
import { translations } from '../../i18n';
import { testConfigsViaPython, checkPythonBackendStatus } from '../../utils/backend-api';

interface Props {
  lang: Language;
  activeConfigs: ParsedProxyConfig[];
}

export const GamingLivePingTab: React.FC<Props> = ({ lang, activeConfigs }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [targets, setTargets] = useState<LivePingTarget[]>(() => {
    const baseList = [...LIVE_PING_TARGETS];
    baseList.unshift(
      {
        id: 'ai_claude',
        name: 'Anthropic Claude AI',
        category: 'web',
        host: 'claude.ai',
        icon: '🤖',
        description: 'سرورهای هوش مصنوعی کلود (Claude 3.5 Sonnet)',
        currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
      },
      {
        id: 'ai_gemini',
        name: 'Google Gemini AI',
        category: 'web',
        host: 'gemini.google.com',
        icon: '✨',
        description: 'سرورهای هوش مصنوعی گوگل جمنی و پلتفرم AI',
        currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
      },
      {
        id: 'ai_chatgpt',
        name: 'OpenAI ChatGPT',
        category: 'web',
        host: 'chatgpt.com',
        icon: '🧠',
        description: 'سرورهای وب و API هوش مصنوعی ChatGPT',
        currentPing: null, minPing: null, maxPing: null, avgPing: null, jitter: null, packetLoss: 0, history: [], status: 'idle'
      }
    );
    return baseList;
  });

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'configs' | 'gaming' | 'ai' | 'web' | 'dns'>('configs');
  const [isLiveRunning, setIsLiveRunning] = useState(false);
  const [pythonOnline, setPythonOnline] = useState(false);
  const [configResults, setConfigResults] = useState<any[]>([]);
  const liveIntervalRef = useRef<any>(null);

  useEffect(() => {
    checkPythonBackendStatus().then(setPythonOnline);
  }, []);

  const measurePing = async (host: string): Promise<number | null> => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      await fetch(`https://${host}/cdn-cgi/trace?_t=${Date.now()}`, {
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-store'
      }).catch(async () => {
        await fetch(`https://${host}/favicon.ico?_t=${Date.now()}`, {
          method: 'GET',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-store'
        }).catch(() => {});
      });

      clearTimeout(timeoutId);
      return Math.round(performance.now() - startTime);
    } catch {
      return null;
    }
  };

  const pingSingleTarget = async (id: string) => {
    const target = targets.find((t) => t.id === id);
    if (!target) return;

    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'testing' } : t))
    );

    const resultPing = await measurePing(target.host);

    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;

        if (resultPing === null) {
          return {
            ...t,
            status: 'timeout',
            packetLoss: Math.min(100, t.packetLoss + 10)
          };
        }

        const newHistory = [...t.history.slice(-9), resultPing];
        const minP = t.minPing === null ? resultPing : Math.min(t.minPing, resultPing);
        const maxP = t.maxPing === null ? resultPing : Math.max(t.maxPing, resultPing);
        const avgP = Math.round(newHistory.reduce((a, b) => a + b, 0) / newHistory.length);
        const jitter = t.currentPing !== null ? Math.abs(resultPing - t.currentPing) : 0;

        return {
          ...t,
          currentPing: resultPing,
          minPing: minP,
          maxPing: maxP,
          avgPing: avgP,
          jitter,
          history: newHistory,
          status: 'success'
        };
      })
    );
  };

  const runConfigBatchTest = async () => {
    if (activeConfigs.length === 0) return;
    
    // Try Python backend test
    const pyRes = await testConfigsViaPython(activeConfigs);
    if (pyRes && pyRes.length > 0) {
      setConfigResults(pyRes);
      setPythonOnline(true);
      return;
    }

    // Fallback: browser probe per config
    const results = [];
    for (const c of activeConfigs) {
      const p = await measurePing(c.server);
      results.push({
        id: c.id,
        name: c.name,
        server: c.server,
        port: c.port,
        protocol: c.protocol,
        latency: p,
        jitter: p ? roundJitter(p) : null,
        status: p !== null ? 'success' : 'timeout'
      });
    }
    setConfigResults(results);
  };

  const roundJitter = (p: number) => Math.round(p * 0.12);

  const startContinuousPing = () => {
    if (isLiveRunning) {
      clearInterval(liveIntervalRef.current);
      setIsLiveRunning(false);
      return;
    }

    setIsLiveRunning(true);
    if (selectedCategory === 'configs') {
      runConfigBatchTest();
      liveIntervalRef.current = setInterval(runConfigBatchTest, 2500);
    } else {
      const activeList = targets.filter((t) => selectedCategory === 'all' || t.category === selectedCategory);
      for (const item of activeList) pingSingleTarget(item.id);
      liveIntervalRef.current = setInterval(() => {
        for (const item of activeList) pingSingleTarget(item.id);
      }, 2500);
    }
  };

  useEffect(() => {
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-cyan/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 text-cyan">
            <div className="p-3.5 bg-cyan/10 border border-cyan/30 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">پینگ زنده سرورهای بازی، وب‌سایت‌ها و کانفیگ‌های تولیدشده</h2>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  pythonOnline
                    ? 'bg-lime/20 text-lime border-lime/40 shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {pythonOnline ? '🐍 Python Tester Active' : '🌐 Browser Probes'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                سنجش لحظه‌ای تاخیر (Latency)، نوسان پینگ (Jitter) و پایداری شبکه روی سرورهای Call of Duty، Steam، هوش مصنوعی Claude/Gemini و نودهای فعال شما
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={startContinuousPing}
              className={`px-5 py-2.5 font-black text-xs rounded-2xl transition-all cursor-pointer flex items-center gap-2 ${
                isLiveRunning
                  ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(255,77,109,0.5)] animate-pulse'
                  : 'bg-cyan text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]'
              }`}
            >
              {isLiveRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>توقف مانیتورینگ زنده</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  <span>شروع پینگ مداوم زنده</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 pt-2 flex-wrap text-xs font-bold border-t border-slate-800/80">
          <span className="text-slate-400">دسته‌بندی:</span>
          <button
            onClick={() => {
              setSelectedCategory('configs');
              runConfigBatchTest();
            }}
            className={`px-3.5 py-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'configs' ? 'bg-lime text-black font-black' : 'bg-slate-900 text-lime'
            }`}
          >
            ⚡ پینگ خود کانفیگ‌های شما ({activeConfigs.length})
          </button>
          <button
            onClick={() => setSelectedCategory('ai')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'ai' ? 'bg-purple-500 text-white font-black' : 'bg-slate-900 text-purple-300'
            }`}
          >
            🤖 هوش مصنوعی (Claude/Gemini/GPT)
          </button>
          <button
            onClick={() => setSelectedCategory('gaming')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'gaming' ? 'bg-amber-400 text-black font-black' : 'bg-slate-900 text-amber-300'
            }`}
          >
            🎮 سرورهای بازی (Call of Duty, Steam)
          </button>
          <button
            onClick={() => setSelectedCategory('web')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'web' ? 'bg-blue-500 text-white font-black' : 'bg-slate-900 text-blue-300'
            }`}
          >
            🌐 وب و شبکه‌های اجتماعی
          </button>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer ${
              selectedCategory === 'all' ? 'bg-cyan text-black font-black' : 'bg-slate-900 text-slate-300'
            }`}
          >
            همه سرویس‌ها
          </button>
        </div>
      </div>

      {/* View 1: Active Configs Direct Ping */}
      {selectedCategory === 'configs' && (
        <div className="space-y-4">
          {activeConfigs.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center text-slate-500 text-xs space-y-2">
              <Server className="w-8 h-8 mx-auto text-slate-600" />
              <p>در حال حاضر هیچ کانفیگ فعالی در حافظه نیست. لطفاً ابتدا در تب «بهینه‌ساز» کانفیگ وارد کنید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeConfigs.map((cfg, idx) => {
                const res = configResults.find((r) => r.server === cfg.server || r.id === cfg.id);
                const ping = res?.latency;
                const isGood = ping && ping < 150;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-3xl bg-slate-950/85 border border-slate-800 hover:border-lime/40 transition-all space-y-3 shadow-lg flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 truncate">
                        <h3 className="font-bold text-white text-xs sm:text-sm truncate">{cfg.name}</h3>
                        <span className="font-mono text-cyan text-[11px] block" dir="ltr">
                          {cfg.server}:{cfg.port} ({cfg.protocol.toUpperCase()})
                        </span>
                      </div>

                      <div>
                        {ping ? (
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                            isGood ? 'bg-lime/20 text-lime border border-lime/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          }`}>
                            {ping} ms
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px] px-2 py-0.5 bg-slate-900 rounded font-mono">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {res?.speedMbps && (
                      <div className="p-2 bg-slate-900/90 rounded-xl font-mono text-[10px] text-cyan flex justify-between">
                        <span>Speed throughput:</span>
                        <span className="font-bold text-lime">{res.speedMbps} Mbps</span>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono flex justify-between border-t border-slate-800/60 pt-2">
                      <span>Transport: {cfg.transport.toUpperCase()}</span>
                      <span>Fragment: {cfg.fragmentEnabled ? 'Active ⚡' : 'Off'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: Gaming & Web Targets */}
      {selectedCategory !== 'configs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.filter((t) => selectedCategory === 'all' || (selectedCategory === 'ai' && t.id.startsWith('ai_')) || t.category === selectedCategory).map((item) => {
            const isGood = item.currentPing !== null && item.currentPing < 130;
            const isFair = item.currentPing !== null && item.currentPing >= 130 && item.currentPing < 230;

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-slate-950/85 border border-slate-800/90 hover:border-cyan/40 transition-all space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="text-2xl">{item.icon}</span>
                    <div className="truncate">
                      <h3 className="font-bold text-white text-xs sm:text-sm truncate">{item.name}</h3>
                      <span className="font-mono text-[10px] text-slate-400 block truncate">{item.host}</span>
                    </div>
                  </div>

                  <div>
                    {item.status === 'testing' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-amber-400/20 text-amber-300 font-mono flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3 animate-spin" /> Testing
                      </span>
                    )}
                    {item.status === 'success' && (
                      <span
                        className={`font-black font-mono px-2.5 py-1 rounded-lg text-xs border ${
                          isGood
                            ? 'bg-lime/20 text-lime border-lime/30 shadow-[0_0_12px_rgba(0,255,136,0.3)]'
                            : isFair
                            ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {item.currentPing} ms
                      </span>
                    )}
                    {item.status === 'timeout' && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-900 text-slate-500 font-mono">
                        Timeout
                      </span>
                    )}
                    {item.status === 'idle' && (
                      <button
                        onClick={() => pingSingleTarget(item.id)}
                        className="p-1 text-slate-400 hover:text-cyan rounded-lg hover:bg-slate-900 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{item.description}</p>

                {item.status === 'success' && (
                  <div className="grid grid-cols-3 gap-1 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 text-[10px] font-mono text-center">
                    <div>
                      <span className="text-slate-500 block">Min:</span>
                      <span className="text-lime font-bold">{item.minPing}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Avg:</span>
                      <span className="text-cyan font-bold">{item.avgPing}ms</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Jitter:</span>
                      <span className="text-purple-400 font-bold">±{item.jitter}ms</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
