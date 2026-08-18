import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Lock,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  QrCode,
  Layers,
  Link2,
  Sparkles,
  RefreshCw,
  FolderArchive,
  ArrowRight,
  HardDrive,
  FileCode2
} from 'lucide-react';
import { Language, ParsedProxyConfig, SavedSubscriptionRecord, AppTab } from '../../types';
import {
  exportObfuscatedData,
  importObfuscatedData,
  getSavedConfigs,
  deleteConfig,
  getSavedSubscriptions,
  deleteSubscription,
  exportDatabaseBackup,
  importDatabaseBackup,
  clearDatabase
} from '../../utils/db';
import { buildOptimizedVlessUri } from '../../utils/config-parser';

interface Props {
  lang: Language;
  onOpenQr: (title: string, url: string) => void;
  setActiveConfigs: (cfgs: ParsedProxyConfig[]) => void;
  onNavigateTab: (tab: AppTab) => void;
}

export const DatabaseManagerTab: React.FC<Props> = ({
  lang,
  onOpenQr,
  setActiveConfigs,
  onNavigateTab
}) => {
  const isFa = lang === 'fa';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedConfigs, setSavedConfigs] = useState<ParsedProxyConfig[]>([]);
  const [savedSubs, setSavedSubs] = useState<SavedSubscriptionRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshDbData = () => {
    setSavedConfigs(getSavedConfigs());
    setSavedSubs(getSavedSubscriptions());
  };

  useEffect(() => {
    refreshDbData();
  }, []);

  const handleDeleteConfig = (id: string) => {
    const updated = deleteConfig(id);
    setSavedConfigs(updated);
  };

  const handleDeleteSub = (id: string) => {
    const updated = deleteSubscription(id);
    setSavedSubs(updated);
  };

  const handleLoadConfigToOptimizer = (cfg: ParsedProxyConfig) => {
    setActiveConfigs([cfg]);
    alert(isFa ? `کانفیگ ${cfg.name} در بهینه‌ساز بارگذاری شد.` : `Loaded ${cfg.name} to optimizer.`);
    onNavigateTab('quick_optimizer');
  };

  const handleLoadAllToOptimizer = () => {
    if (savedConfigs.length === 0) return;
    setActiveConfigs(savedConfigs);
    alert(isFa ? `تعداد ${savedConfigs.length} کانفیگ ذخیره‌شده در بهینه‌ساز بارگذاری شد.` : `Loaded ${savedConfigs.length} configs to optimizer.`);
    onNavigateTab('quick_optimizer');
  };

    const handleExportDataFile = () => {
    const obfContent = exportObfuscatedData();
    const blob = new Blob([obfContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf-optimizor-${new Date().toISOString().split('T')[0]}.data`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportDataFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && (importObfuscatedData(content) || importDatabaseBackup(content))) {
        refreshDbData();
        alert(isFa ? 'پایگاه داده از فایل رمزگذاری‌شده .data با موفقیت بازیابی شد!' : 'Restored from .data file!');
      } else {
        alert(isFa ? 'فایل داده نامعتبر است.' : 'Invalid data file.');
      }
    };
    reader.readAsText(file);
  };

  const handleExportBackup = () => {
    const jsonBackup = exportDatabaseBackup();
    const blob = new Blob([jsonBackup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf-optimizor-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDatabaseBackup(content)) {
        refreshDbData();
        alert(isFa ? 'پایگاه داده و حافظه با موفقیت بازیابی شد!' : 'Database restored successfully!');
      } else {
        alert(isFa ? 'فایل پشتیبان نامعتبر است.' : 'Invalid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = () => {
    if (confirm(isFa ? 'آیا از پاک‌سازی کامل حافظه اطمینان دارید؟' : 'Are you sure you want to clear database?')) {
      clearDatabase();
      refreshDbData();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-emerald-400/30 shadow-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 text-emerald-400">
            <div className="p-3.5 bg-emerald-400/10 border border-emerald-400/30 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.25)]">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>پایگاه داده و حافظه دائمی (Database & Storage Hub)</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Persistent DB 💾
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                ذخیره‌سازی دائمی کانفیگ‌ها، سابسکریپشن‌های آنلاین، پشتیبان‌گیری کامل (JSON Backup) و بازیابی اطلاعات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportBackup}
              accept=".json,.data,.dat,.cfg"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-cyan border border-cyan/30 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>بازیابی از Backup</span>
            </button>

            <button
              onClick={handleExportDataFile}
              className="px-3.5 py-2 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              title="خروجی محافظت‌شده .data"
            >
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span>خروجی رمزنگاری‌شده (.data)</span>
            </button>

            <button
              onClick={handleExportBackup}
              className="px-4 py-2 bg-emerald-400 text-black font-black text-xs rounded-xl hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دریافت فایل پشتیبان (JSON)</span>
            </button>
          </div>
        </div>

        {/* DB Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] block">کانفیگ‌های ذخیره‌شده:</span>
            <span className="text-emerald-400 font-bold text-base">{savedConfigs.length} نود</span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] block">لینک‌های سابسکریپشن:</span>
            <span className="text-cyan font-bold text-base">{savedSubs.length} لینک</span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] block">نوع پایگاه داده:</span>
            <span className="text-purple-400 font-bold text-sm">IndexedDB + Local</span>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-0.5">
            <span className="text-slate-500 text-[10px] block">وضعیت حافظه:</span>
            <span className="text-lime font-bold text-sm">Auto-Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Saved Configs List */}
        <div className="lg:col-span-7 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-white text-xs sm:text-sm">کانفیگ‌های ذخیره‌شده در حافظه ({savedConfigs.length})</span>
            </div>

            {savedConfigs.length > 0 && (
              <button
                onClick={handleLoadAllToOptimizer}
                className="px-3 py-1.5 bg-lime/15 text-lime hover:bg-lime/25 border border-lime/30 font-bold text-xs rounded-xl cursor-pointer"
              >
                بارگذاری همه در بهینه‌ساز
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {savedConfigs.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                <HardDrive className="w-8 h-8 text-slate-600" />
                <span>هنوز کانفیگی در حافظه ذخیره نشده است. با بهینه‌سازی کانفیگ، به طور خودکار ذخیره می‌شود.</span>
              </div>
            ) : (
              savedConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-emerald-400/40 transition-all space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[220px]">{cfg.name}</span>
                    <span className="font-mono text-[10px] text-cyan px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {cfg.server}:{cfg.port}
                    </span>
                  </div>

                  <div className="bg-slate-900/90 p-2 rounded-xl font-mono text-[10px] text-slate-300 truncate" dir="ltr">
                    {cfg.raw || buildOptimizedVlessUri(cfg)}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleLoadConfigToOptimizer(cfg)}
                      className="flex-1 py-1.5 bg-emerald-400/15 hover:bg-emerald-400/25 text-emerald-300 border border-emerald-400/30 rounded-xl font-bold text-[11px] cursor-pointer"
                    >
                      بارگذاری در بهینه‌ساز
                    </button>
                    <button
                      onClick={() => handleCopy(cfg.raw || buildOptimizedVlessUri(cfg), cfg.id)}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                      title="کپی کانفیگ"
                    >
                      {copiedId === cfg.id ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onOpenQr(cfg.name, cfg.raw || buildOptimizedVlessUri(cfg))}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 text-cyan rounded-xl cursor-pointer"
                      title="QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(cfg.id)}
                      className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-rose-400 rounded-xl cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Saved Subscriptions */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan" />
                <span className="font-bold text-white text-xs sm:text-sm">لینک‌های اشتراک آنلاین ({savedSubs.length})</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {savedSubs.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center text-slate-500 text-xs gap-2 text-center p-4">
                  <Link2 className="w-7 h-7 text-slate-600" />
                  <span>سابسکریپشن‌های ایجادشده در تب «ساخت لینک اشتراک» در اینجا ثبت و مدیریت می‌شوند.</span>
                </div>
              ) : (
                savedSubs.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[180px]">{sub.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lime/15 text-lime border border-lime/30">
                        {sub.updateIntervalHours}h Auto-Sync
                      </span>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-xl font-mono text-[10px] text-cyan truncate" dir="ltr">
                      {sub.url}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(sub.url, sub.id)}
                        className="flex-1 py-1 bg-lime text-black font-black text-[11px] rounded-xl cursor-pointer"
                      >
                        {copiedId === sub.id ? 'کپی شد!' : 'کپی لینک ساب'}
                      </button>
                      <button
                        onClick={() => onOpenQr(sub.title, sub.url)}
                        className="p-1.5 bg-slate-900 text-cyan rounded-xl cursor-pointer"
                        title="QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSub(sub.id)}
                        className="p-1.5 bg-slate-900 text-rose-400 rounded-xl cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80">
            <button
              onClick={handleClearAll}
              className="w-full py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی کامل حافظه محلی (Reset Storage)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
