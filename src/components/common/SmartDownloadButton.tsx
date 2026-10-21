import React, { useState } from 'react';
import { Download, ExternalLink, Check } from 'lucide-react';
import { executeTwoStepDownload, downloadMediaFile } from '../../utils/adDownloadManager';
import { useApp } from '../../context/AppContext';

interface SmartDownloadButtonProps {
  actionId: string;
  fileUrl?: string;
  filename?: string;
  onCustomDownload?: () => void | Promise<void>;
  className?: string;
  showText?: boolean;
  text?: string;
  iconOnly?: boolean;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SmartDownloadButton: React.FC<SmartDownloadButtonProps> = ({
  actionId,
  fileUrl,
  filename = 'download',
  onCustomDownload,
  className = '',
  showText = true,
  text = 'Download',
  iconOnly = false,
  title = 'Download',
  size = 'md'
}) => {
  const { showToast } = useApp();
  const [clickStep, setClickStep] = useState<0 | 1>(0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const res = executeTwoStepDownload(
      actionId,
      async () => {
        if (onCustomDownload) {
          await onCustomDownload();
        } else if (fileUrl) {
          await downloadMediaFile(fileUrl, filename);
        }
        showToast('Download started!', 'success');
      },
      (notice) => {
        showToast(notice, 'info');
      }
    );

    if (res.step === 1) {
      setClickStep(1);
    } else {
      setClickStep(0);
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-3.5 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5 font-bold'
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`relative flex items-center justify-center rounded-full transition-all duration-150 ${
          clickStep === 1
            ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
            : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-md'
        } ${className}`}
        title={clickStep === 1 ? 'Click again to download' : title}
        aria-label={title}
      >
        {clickStep === 1 ? (
          <Download className="w-5 h-5 stroke-[2.5]" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center font-bold rounded-xl shadow-xs transition-all duration-150 active:scale-95 ${
        clickStep === 1
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-300'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${sizeClasses[size]} ${className}`}
      title={clickStep === 1 ? 'Click again to confirm download' : title}
    >
      <Download className="w-4 h-4 shrink-0" />
      {showText && (
        <span>
          {clickStep === 1 ? 'Click to Save File' : text}
        </span>
      )}
    </button>
  );
};
