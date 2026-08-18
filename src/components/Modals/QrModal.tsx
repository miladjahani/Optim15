import React, { useState } from 'react';
import { X, Download, Copy, Check, QrCode } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  lang: Language;
}

export const QrModal: React.FC<Props> = ({ isOpen, onClose, title, url, lang }) => {
  const t = translations[lang];
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    url
  )}&margin=15&bgcolor=ffffff&color=080a0e&format=svg`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm glass-card rounded-3xl p-6 border border-lime/30 shadow-2xl text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/60 border border-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-2 text-lime">
          <QrCode className="w-6 h-6" />
          <h3 className="text-lg font-black text-white">{title}</h3>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-inner inline-block mx-auto border-4 border-slate-900">
          <img src={qrImageUrl} alt={title} className="w-52 h-52 object-contain rounded-lg mx-auto" />
        </div>

        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 text-left font-mono text-[11px] text-slate-400 break-all max-h-20 overflow-y-auto" dir="ltr">
          {url}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-lime text-black font-bold text-xs rounded-xl hover:shadow-[0_0_15px_rgba(0,255,136,0.4)] transition-all cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? t.copied : t.copy}</span>
          </button>
          
          <a
            href={qrImageUrl}
            download="qrcode.svg"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-cyan border border-cyan/30 text-xs font-bold rounded-xl cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>SVG</span>
          </a>
        </div>
      </div>
    </div>
  );
};
