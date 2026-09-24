import React from 'react';
import { X, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MediaLightboxModal: React.FC = () => {
  const { mediaLightbox, closeMediaLightbox } = useApp();

  if (!mediaLightbox) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-150 p-4">
      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <a
          href={mediaLightbox.url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          title="Open or Download"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={closeMediaLightbox}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          title="Close Lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Media Container */}
      <div className="max-w-5xl max-h-[85vh] flex flex-col items-center justify-center">
        {mediaLightbox.type === 'image' ? (
          <img
            src={mediaLightbox.url}
            alt={mediaLightbox.caption || 'Full view'}
            className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        ) : (
          <video
            src={mediaLightbox.url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}

        {mediaLightbox.caption && (
          <p className="mt-3 text-sm text-white/80 text-center max-w-xl">
            {mediaLightbox.caption}
          </p>
        )}
      </div>
    </div>
  );
};
