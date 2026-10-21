import React, { useState, useRef, useEffect } from 'react';
import { QrCode, Download, ExternalLink, X, Sparkles, Copy, Check } from 'lucide-react';
import { openQrCodeTools, executeTwoStepDownload, downloadCanvas, QR_CODE_TOOLS_URL } from '../../utils/adDownloadManager';
import { useApp } from '../../context/AppContext';

interface QuickQrGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickQrGeneratorModal: React.FC<QuickQrGeneratorModalProps> = ({ isOpen, onClose }) => {
  const { showToast } = useApp();
  const [inputText, setInputText] = useState('https://tsquickqr.netlify.app');
  const [qrColor, setQrColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [downloadStep, setDownloadStep] = useState<0 | 1>(0);
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawQrCode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 320;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);

    // Fetch or generate using qrserver API into canvas image
    const encoded = encodeURIComponent(inputText.trim() || 'https://tsquickqr.netlify.app');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Using color without '#' for api
    const colorHex = qrColor.replace('#', '');
    const bgHex = bgColor.replace('#', '');
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&color=${colorHex}&bgcolor=${bgHex}&margin=10`;

    img.onload = () => {
      ctx.drawImage(img, 10, 10, 300, 300);
    };

    img.onerror = () => {
      // Fallback fallback pattern if offline
      ctx.fillStyle = qrColor;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Code Preview', size / 2, size / 2);
    };
  };

  useEffect(() => {
    if (isOpen) {
      drawQrCode();
    }
  }, [isOpen, inputText, qrColor, bgColor]);

  if (!isOpen) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const res = executeTwoStepDownload(
      'qr_code_generator_download',
      () => {
        downloadCanvas(canvas, `qrcode_${Date.now()}.png`);
        showToast('QR Code image downloaded!', 'success');
      },
      (notice) => {
        showToast(notice, 'info');
      }
    );

    setDownloadStep(res.step === 1 ? 1 : 0);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inputText);
    setIsCopied(true);
    showToast('Text copied to clipboard', 'info');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>QR Code Tools</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  Category Tool
                </span>
              </h2>
              <p className="text-xs text-slate-500">Instant generator with download & web tools</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* External Web App Banner */}
        <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-3">
          <div className="text-xs">
            <div className="font-extrabold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Full Web App: tsquickqr.netlify.app</span>
            </div>
            <div className="text-blue-100 text-[11px] mt-0.5">
              Advanced styling, logos, scanner & batch export
            </div>
          </div>
          <button
            onClick={openQrCodeTools}
            className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer active:scale-95 transition-transform"
          >
            <span>Open App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Input text/url */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Enter Text or Website URL
            </label>
            <div className="relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="https://example.com or any message..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title="Copy text"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-500 mb-1">Color</span>
              <div className="flex items-center gap-1.5">
                {[
                  { color: '#0f172a', name: 'Dark Slate' },
                  { color: '#2563eb', name: 'Blue' },
                  { color: '#7c3aed', name: 'Purple' },
                  { color: '#059669', name: 'Emerald' },
                  { color: '#dc2626', name: 'Red' }
                ].map((c) => (
                  <button
                    key={c.color}
                    onClick={() => setQrColor(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-6 h-6 rounded-full transition-all ${
                      qrColor === c.color ? 'ring-2 ring-blue-500 scale-110 shadow-xs' : 'opacity-80'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div className="text-right">
              <span className="block text-xs font-bold text-slate-500 mb-1">Size</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                300 × 300 px
              </span>
            </div>
          </div>

          {/* Live Canvas Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <canvas
              ref={canvasRef}
              className="w-48 h-48 rounded-xl shadow-md bg-white border border-slate-200"
            />
          </div>

          {/* Download Action with 2-step Monetization */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownload}
              className={`w-full py-3 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 ${
                downloadStep === 1
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-4 ring-amber-300/40 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>
                {downloadStep === 1 ? 'Click to Confirm Download PNG' : 'Download QR Code (PNG)'}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              High-resolution PNG output ready for print, social, or digital distribution
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
