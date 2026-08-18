import React, { useState, useEffect } from 'react';
import { AppTab, Language, Theme, ParsedProxyConfig } from './types';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { QuickOptimizerTab } from './components/Tabs/QuickOptimizerTab';
import { SubLinkGeneratorTab } from './components/Tabs/SubLinkGeneratorTab';
import { DatabaseManagerTab } from './components/Tabs/DatabaseManagerTab';
import { GamingLivePingTab } from './components/Tabs/GamingLivePingTab';
import { IpScannerTab } from './components/Tabs/IpScannerTab';
import { DohLabTab } from './components/Tabs/DohLabTab';
import { FragmentLabTab } from './components/Tabs/FragmentLabTab';
import { UniversalConverterTab } from './components/Tabs/UniversalConverterTab';
import { BatchSubCleanerTab } from './components/Tabs/BatchSubCleanerTab';
import { NodeDoctorTab } from './components/Tabs/NodeDoctorTab';
import { ToolkitTab } from './components/Tabs/ToolkitTab';
import { QrModal } from './components/Modals/QrModal';
import { getSavedConfigs } from './utils/db';

export function App() {
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('cf_opt_lang') as Language) || 'fa';
  });
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('cf_opt_theme') as Theme) || 'dark';
  });

  const [activeTab, setActiveTab] = useState<AppTab>('quick_optimizer');
  const [activeConfigs, setActiveConfigs] = useState<ParsedProxyConfig[]>(() => {
    return getSavedConfigs();
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const [qrData, setQrData] = useState<{ isOpen: boolean; title: string; url: string }>({
    isOpen: false,
    title: '',
    url: ''
  });

  useEffect(() => {
    localStorage.setItem('cf_opt_lang', lang);
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('cf_opt_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
  };

  const openQr = (title: string, url: string) => {
    setQrData({ isOpen: true, title, url });
  };

  return (
    <div className="min-h-screen bg-[#080a0e] text-slate-100 flex flex-col font-sans transition-colors pb-20 lg:pb-10">
      {/* Glow ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-lime/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-cyan/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <QrModal
        isOpen={qrData.isOpen}
        onClose={() => setQrData({ isOpen: false, title: '', url: '' })}
        title={qrData.title}
        url={qrData.url}
        lang={lang}
      />

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 z-10">
        {activeTab === 'quick_optimizer' && (
          <QuickOptimizerTab
            lang={lang}
            onOpenQr={openQr}
            activeConfigs={activeConfigs}
            setActiveConfigs={setActiveConfigs}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'sub_link_gen' && (
          <SubLinkGeneratorTab
            lang={lang}
            onOpenQr={openQr}
            activeConfigs={activeConfigs}
          />
        )}
        {activeTab === 'database_manager' && (
          <DatabaseManagerTab
            lang={lang}
            onOpenQr={openQr}
            setActiveConfigs={setActiveConfigs}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'gaming_live_ping' && (
          <GamingLivePingTab
            lang={lang}
            activeConfigs={activeConfigs}
          />
        )}
        {activeTab === 'ip_scanner' && (
          <IpScannerTab
            lang={lang}
            activeConfigs={activeConfigs}
            setActiveConfigs={setActiveConfigs}
            onNavigateTab={setActiveTab}
          />
        )}
        {activeTab === 'doh_lab' && <DohLabTab lang={lang} />}
        {activeTab === 'fragment_lab' && <FragmentLabTab lang={lang} onOpenQr={openQr} />}
        {activeTab === 'converter' && (
          <UniversalConverterTab
            lang={lang}
            onOpenQr={openQr}
            activeConfigs={activeConfigs}
          />
        )}
        {activeTab === 'batch_sub' && <BatchSubCleanerTab lang={lang} />}
        {activeTab === 'node_doctor' && <NodeDoctorTab lang={lang} />}
        {activeTab === 'toolkit' && (
          <ToolkitTab
            lang={lang}
            activeConfigs={activeConfigs}
          />
        )}
      </main>

      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />
    </div>
  );
}
