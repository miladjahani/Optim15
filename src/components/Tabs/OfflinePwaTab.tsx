import React from 'react';
import {
  Download,
  Copy,
  Terminal,
  Smartphone,
  ShieldCheck,
  Cpu,
  Globe
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../i18n';

interface Props {
  lang: Language;
}

export const OfflinePwaTab: React.FC<Props> = ({ lang }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const termuxCliSnippet = `#!/data/data/com.termux/files/usr/bin/bash
# CF-Optimizor CLI Tool for Termux
pkg update -y && pkg install -y nodejs curl
npm install -g serve
curl -sO https://raw.githubusercontent.com/.../index.html
serve -s . -l 8080
`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-blue-500/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3 text-blue-400">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{t.offline_title}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{t.offline_desc}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standalone HTML download */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan" />
              <span>نسخه تک‌فایلی مستقل آفلاین (Zero-Dependency)</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              کل این برنامه در یک فایل سبک `index.html` گنجانده شده است که می‌توانید آن را دانلود کرده و بدون اتصال به اینترنت روی هر مرورگر یا ترمینال اجرا کنید.
            </p>
          </div>

          <a
            href="/index.html"
            download="CF-Optimizor-Standalone-Pro.html"
            className="w-full py-3 bg-cyan text-black font-black rounded-xl text-center flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>دانلود مستقیم فایل تک‌برگی HTML</span>
          </a>
        </div>

        {/* Termux Integration */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-pink-400" />
              <span>اجرای آفلاین در محیط Termux اندروید</span>
            </h3>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-900 font-mono text-[11px] text-lime overflow-x-auto" dir="ltr">
            <pre className="whitespace-pre-wrap">{termuxCliSnippet}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
