import React from 'react';
import {
  Zap,
  Link2,
  Gamepad2,
  Activity,
  Database,
  Shield,
  Sliders,
  RefreshCw,
  Layers,
  Stethoscope,
  Wrench,
  Download,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { AppTab, Language, Theme } from '../types';
import { translations } from '../i18n';

interface Props {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  lang: Language;
  setLang: (l: Language) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  theme,
  setTheme,
  deferredPrompt,
  onInstallPwa
}) => {
  const t = translations[lang];

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'quick_optimizer', label: t.tab_quick_opt, icon: <Zap className="w-4 h-4 text-lime" /> },
    { id: 'sub_link_gen', label: '🔗 ساخت لینک اشتراک', icon: <Link2 className="w-4 h-4 text-emerald-400" /> },
    { id: 'database_manager', label: '💾 پایگاه داده و حافظه', icon: <Database className="w-4 h-4 text-cyan" /> },
    { id: 'gaming_live_ping', label: t.tab_gaming_ping, icon: <Gamepad2 className="w-4 h-4 text-purple-400" /> },
    { id: 'ip_scanner', label: t.tab_ip_scanner, icon: <Activity className="w-4 h-4 text-amber-400" /> },
    { id: 'doh_lab', label: t.tab_doh_lab, icon: <Shield className="w-4 h-4 text-purple-400" /> },
    { id: 'fragment_lab', label: t.tab_fragment_lab, icon: <Sliders className="w-4 h-4 text-pink-400" /> },
    { id: 'converter', label: t.tab_converter, icon: <RefreshCw className="w-4 h-4 text-blue-400" /> },
    { id: 'batch_sub', label: t.tab_batch_sub, icon: <Layers className="w-4 h-4 text-emerald-400" /> },
    { id: 'node_doctor', label: t.tab_node_doctor, icon: <Stethoscope className="w-4 h-4 text-indigo-400" /> },
    { id: 'toolkit', label: t.tab_toolkit, icon: <Wrench className="w-4 h-4 text-rose-400" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080a0e]/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-lime via-cyan to-purple-600 p-0.5 shadow-[0_0_20px_rgba(0,255,136,0.35)] flex items-center justify-center">
              <div className="w-full h-full bg-[#080a0e] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-lime animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  <span>CF-OPTIMIZOR</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-lime/15 text-lime border border-lime/30 mr-2">
                    ENTERPRISE DB v6.0
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                بهینه‌ساز شبکه، پایگاه داده دائمی، پینگ گیمینگ و تزریق فرگمنت
              </p>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={onInstallPwa}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-lime text-black rounded-xl hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all cursor-pointer animate-pulse"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.pwa_install}</span>
              </button>
            )}

            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              {t.lang_toggle}
            </button>

            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
              title={t.theme_toggle}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan" />}
            </button>
          </div>
        </div>

        {/* Tabs Ribbon */}
        <nav className="hidden lg:flex items-center gap-1 mt-3 pt-2 border-t border-white/5 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-lime/20 to-cyan/20 text-white border border-lime/40 shadow-[0_0_15px_rgba(0,255,136,0.2)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
