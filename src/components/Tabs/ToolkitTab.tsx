import React, { useState } from 'react';
import {
  Wrench,
  QrCode,
  Binary,
  Key,
  Copy,
  Check,
  Download,
  RefreshCw,
  Server,
  FileCode2,
  Link2
} from 'lucide-react';
import { Language, ParsedProxyConfig } from '../../types';
import { translations } from '../../i18n';
import { buildSingBoxJson, buildOptimizedVlessUri } from '../../utils/config-parser';

interface Props {
  lang: Language;
  activeConfigs: ParsedProxyConfig[];
}

export const ToolkitTab: React.FC<Props> = ({ lang, activeConfigs }) => {
  const t = translations[lang];
  const isFa = lang === 'fa';

  const [qrType, setQrType] = useState<'config' | 'sublink' | 'json' | 'base64'>('sublink');
  const [qrText, setQrText] = useState(
    'https://gist.githubusercontent.com/raw/example/sub.txt'
  );

  const [b64Input, setB64Input] = useState('');
  const [b64Output, setB64Output] = useState('');
  const [uuids, setUuids] = useState<string[]>(['351c9981-04b6-4103-aa4b-864aa9c91469']);
  const [copiedUuid, setCopiedUuid] = useState<string | null>(null);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrText)}&format=svg`;

  const handleSelectQrType = (type: 'config' | 'sublink' | 'json' | 'base64') => {
    setQrType(type);
    if (type === 'json') {
      if (activeConfigs.length > 0) {
        setQrText(buildSingBoxJson(activeConfigs));
      } else {
        setQrText('{"outbounds":[{"type":"vless","server":"104.16.1.1"}]}');
      }
    } else if (type === 'config') {
      if (activeConfigs.length > 0) {
        setQrText(buildOptimizedVlessUri(activeConfigs[0]));
      } else {
        setQrText('vless://351c9981-04b6-4103-aa4b-864aa9c91469@104.16.1.1:443?security=tls#⚡-CF-Pro');
      }
    } else if (type === 'base64') {
      if (activeConfigs.length > 0) {
        const raw = activeConfigs.map((c) => buildOptimizedVlessUri(c)).join('\n');
        setQrText(btoa(unescape(encodeURIComponent(raw))));
      } else {
        setQrText('dmxlc3M6Ly9leGFtcGxl...');
      }
    } else {
      setQrText('https://gist.githubusercontent.com/raw/example/sub.txt');
    }
  };

  const encodeB64 = () => {
    try {
      setB64Output(btoa(unescape(encodeURIComponent(b64Input))));
    } catch {
      setB64Output('خطا در اینکود');
    }
  };

  const decodeB64 = () => {
    try {
      setB64Output(decodeURIComponent(escape(atob(b64Input.trim()))));
    } catch {
      setB64Output('رشته نامعتبر است');
    }
  };

  const generateUuids = () => {
    const list = [1, 2, 3].map(() =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      })
    );
    setUuids(list);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      {/* Top Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/30 shadow-2xl space-y-3">
        <div className="flex items-center gap-3 text-rose-400">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{t.tool_title}</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              استودیو جامع QR بارکد برای لینک سابسکریپشن، فایل JSON، Base64، مبدل یونیکد و UUID v4
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Universal QR Code Studio */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <QrCode className="w-4 h-4 text-rose-400" />
            <span>استودیو بارکد QR (با پشتیبانی از لینک ساب، JSON و کانفیگ):</span>
          </h3>

          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => handleSelectQrType('sublink')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                qrType === 'sublink' ? 'bg-lime text-black' : 'bg-slate-900 text-slate-400'
              }`}
            >
              🔗 لینک سابسکریپشن
            </button>
            <button
              onClick={() => handleSelectQrType('json')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                qrType === 'json' ? 'bg-purple-500 text-white' : 'bg-slate-900 text-slate-400'
              }`}
            >
              📄 محتوای JSON
            </button>
            <button
              onClick={() => handleSelectQrType('config')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                qrType === 'config' ? 'bg-cyan text-black' : 'bg-slate-900 text-slate-400'
              }`}
            >
              ⚡ کانفیگ VLESS/Trojan
            </button>
            <button
              onClick={() => handleSelectQrType('base64')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                qrType === 'base64' ? 'bg-amber-400 text-black' : 'bg-slate-900 text-slate-400'
              }`}
            >
              🔤 کد Base64
            </button>
          </div>

          <textarea
            rows={3}
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px] focus:border-rose-400 focus:outline-none"
            dir="ltr"
          />

          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl border-4 border-slate-900 mx-auto shadow-inner">
              <img src={qrImageUrl} alt="QR Preview" className="w-36 h-36 object-contain rounded" />
            </div>

            <div className="space-y-2 flex-1">
              <a
                href={qrImageUrl}
                target="_blank"
                download="qrcode.svg"
                className="w-full py-2 bg-rose-500 text-white font-bold rounded-xl text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود بارکد وکتور SVG</span>
              </a>
            </div>
          </div>
        </div>

        {/* Base64 Unicode Converter */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs flex flex-col">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Binary className="w-4 h-4 text-cyan" />
            <span>مبدل دوسویه Base64 Unicode-Safe:</span>
          </h3>

          <textarea
            rows={3}
            value={b64Input}
            onChange={(e) => setB64Input(e.target.value)}
            placeholder="متن یا سابسکریپشن Base64..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono text-[11px]"
            dir="ltr"
          />

          <div className="flex items-center gap-2">
            <button onClick={encodeB64} className="flex-1 py-2 bg-cyan text-black font-bold rounded-xl cursor-pointer">
              اینکود Base64
            </button>
            <button onClick={decodeB64} className="flex-1 py-2 bg-slate-900 text-cyan border border-cyan/30 font-bold rounded-xl cursor-pointer">
              دیکود Base64
            </button>
          </div>

          {b64Output && (
            <div className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-lime break-all">
              <pre className="whitespace-pre-wrap max-h-24 overflow-y-auto">{b64Output}</pre>
            </div>
          )}
        </div>

        {/* UUID v4 Generator */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-purple-400" />
              <span>تولیدکننده امن شناسه UUID v4:</span>
            </h3>
            <button
              onClick={generateUuids}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>تولید مجدد</span>
            </button>
          </div>

          <div className="space-y-2">
            {uuids.map((u, i) => (
              <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-[11px] text-white">
                <span className="text-lime font-bold truncate max-w-[240px]">{u}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(u);
                    setCopiedUuid(u);
                    setTimeout(() => setCopiedUuid(null), 2000);
                  }}
                  className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                >
                  {copiedUuid === u ? <Check className="w-3.5 h-3.5 text-lime" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Backend API Runner */}
        <div className="glass-card rounded-3xl p-6 border border-white/10 shadow-xl space-y-4 text-xs">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-lime" />
            <span>راه‌اندازی سرور بک‌اند اختصاصی (Node.js Backend):</span>
          </h3>
          <p className="text-slate-400 leading-relaxed">
            برای فعال‌سازی کامل سرور پروکسی محلی و حل محدودیت‌های شبکه، دستور زیر را در ترمینال یا Termux اجرا کنید:
          </p>
          <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-lime" dir="ltr">npm run server</pre>
        </div>
      </div>
    </div>
  );
};
