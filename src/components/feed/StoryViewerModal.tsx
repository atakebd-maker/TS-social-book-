import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Eye, Trash2, Heart, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { storyService } from '../../services/storyService';
import { Story } from '../../types';
import { executeTwoStepDownload, downloadMediaFile } from '../../utils/adDownloadManager';

export const StoryViewerModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeStoryId, closeStoryViewer, showToast, refreshKey, triggerRefresh } = useApp();

  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [storyDownloadStep, setStoryDownloadStep] = useState<0 | 1>(0);

  useEffect(() => {
    if (!activeStoryId) return;

    storyService.getActiveStories().then((list) => {
      setStories(list);
      const idx = list.findIndex((s) => s.id === activeStoryId);
      setCurrentIndex(idx !== -1 ? idx : 0);
      setProgress(0);
    });
  }, [activeStoryId]);

  const currentStory = stories[currentIndex];

  // Record view
  useEffect(() => {
    if (currentStory && currentUser) {
      storyService.recordStoryView(currentStory.id, {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      });
    }
  }, [currentStory, currentUser]);

  // Timer loop
  useEffect(() => {
    if (!activeStoryId || isPaused || stories.length === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          // Advance to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else {
            closeStoryViewer();
            return 100;
          }
        }
        return prev + 2; // 50 ticks * 100ms = 5000ms (5 seconds)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryId, currentIndex, isPaused, stories.length, closeStoryViewer]);

  if (!activeStoryId || !currentStory) return null;

  const isOwner = currentUser?.id === currentStory.authorId || currentUser?.role === 'admin';

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((idx) => idx - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((idx) => idx + 1);
      setProgress(0);
    } else {
      closeStoryViewer();
    }
  };

  const handleDelete = async () => {
    if (!currentUser) return;
    try {
      await storyService.deleteStory(currentStory.id, currentUser.id);
      showToast('Story removed', 'info');
      triggerRefresh();
      closeStoryViewer();
    } catch {
      showToast('Could not delete story', 'error');
    }
  };

  const handleDownloadStory = () => {
    if (!currentStory?.mediaUrl) return;
    const ext = currentStory.mediaType === 'video' ? 'mp4' : 'jpg';
    const filename = `story_${currentStory.id}.${ext}`;

    const res = executeTwoStepDownload(
      `story_${currentStory.id}`,
      async () => {
        await downloadMediaFile(currentStory.mediaUrl!, filename);
        showToast('Story downloaded!', 'success');
      },
      (msg) => {
        showToast(msg, 'info');
      }
    );

    setStoryDownloadStep(res.step === 1 ? 1 : 0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Top Header controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-30 flex items-center justify-between max-w-lg mx-auto">
        {/* Progress bars for each story */}
        <div className="flex items-center gap-1.5 w-full mb-3">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear rounded-full"
                style={{
                  width:
                    idx < currentIndex
                      ? '100%'
                      : idx === currentIndex
                      ? `${progress}%`
                      : '0%'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Story Container */}
      <div
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="relative w-full max-w-md h-full max-h-[88vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        style={{
          background: currentStory.backgroundGradient || '#0f172a'
        }}
      >
        {/* Media Background */}
        {currentStory.mediaUrl && currentStory.mediaType === 'image' && (
          <img
            src={currentStory.mediaUrl}
            alt={currentStory.authorName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {currentStory.mediaUrl && currentStory.mediaType === 'video' && (
          <video
            src={currentStory.mediaUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Text Story Content */}
        {currentStory.mediaType === 'text' && currentStory.textContent && (
          <div className="absolute inset-0 p-8 flex items-center justify-center text-center text-white text-xl sm:text-2xl font-bold leading-relaxed">
            {currentStory.textContent}
          </div>
        )}

        {/* Top Overlay with Author details */}
        <div className="relative z-20 p-4 pt-7 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentStory.authorAvatar}
              alt={currentStory.authorName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
            />
            <div>
              <div className="text-white font-bold text-sm leading-tight flex items-center gap-1.5">
                {currentStory.authorName}
              </div>
              <div className="text-white/70 text-xs">
                Active 24h Story
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStory.mediaUrl && (
              <button
                onClick={handleDownloadStory}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  storyDownloadStep === 1
                    ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
                    : 'bg-black/40 hover:bg-black/60 text-white'
                }`}
                title={storyDownloadStep === 1 ? 'Click again to download' : 'Download Story'}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-rose-600/80 text-white flex items-center justify-center transition-colors"
                title="Delete this story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={closeStoryViewer}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Text Caption overlay if image has text */}
        {currentStory.mediaUrl && currentStory.textContent && (
          <div className="relative z-20 mx-4 mb-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl text-white text-sm font-medium text-center">
            {currentStory.textContent}
          </div>
        )}

        {/* Bottom Interactive Area */}
        <div className="relative z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between">
          {/* Viewers toggle (for story creator) */}
          {isOwner ? (
            <button
              onClick={() => setShowViewers((prev) => !prev)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full text-xs font-semibold flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{currentStory.viewers?.length || 0} Viewers</span>
            </button>
          ) : (
            <div className="text-white/60 text-xs">
              Story expires automatically after 24 hours
            </div>
          )}

          <button
            onClick={() => showToast('Reaction sent to story!', 'success')}
            className="w-10 h-10 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
            title="Send love"
          >
            <Heart className="w-5 h-5 fill-current" />
          </button>
        </div>

        {/* Tap areas for previous / next */}
        <div
          onClick={handlePrev}
          className="absolute inset-y-16 left-0 w-1/3 z-10 cursor-pointer"
          title="Previous Story"
        />
        <div
          onClick={handleNext}
          className="absolute inset-y-16 right-0 w-1/3 z-10 cursor-pointer"
          title="Next Story"
        />

        {/* Viewers modal sheet if open */}
        {showViewers && (
          <div className="absolute inset-x-0 bottom-0 max-h-72 bg-slate-900/95 backdrop-blur-md rounded-t-3xl p-4 z-30 overflow-y-auto border-t border-slate-700 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <h4 className="text-white font-bold text-sm">Story Viewers</h4>
              <button
                onClick={() => setShowViewers(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {currentStory.viewers && currentStory.viewers.length > 0 ? (
              <div className="space-y-2">
                {currentStory.viewers.map((viewer) => (
                  <div key={viewer.userId} className="flex items-center gap-2.5">
                    <img
                      src={viewer.userAvatar}
                      alt={viewer.userName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-white text-xs font-semibold">{viewer.userName}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-xs text-center py-4">No viewers yet</div>
            )}
          </div>
        )}
      </div>

      {/* External Next / Prev chevron buttons for desktop */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden sm:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden sm:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/40 text-white items-center justify-center transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};
