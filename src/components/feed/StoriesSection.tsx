import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { storyService } from '../../services/storyService';
import { Story } from '../../types';

export const StoriesSection: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { openStoryViewer, openCreateStoryModal, refreshKey } = useApp();
  const [stories, setStories] = useState<Story[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const loadStories = async () => {
    const list = await storyService.getActiveStories();
    setStories(list);
  };

  useEffect(() => {
    loadStories();
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative mb-6">
      {/* Scroll controls */}
      <button
        onClick={() => handleScroll('left')}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleScroll('right')}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Stories Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth"
      >
        {/* Create Story Card */}
        <div
          onClick={() => {
            if (currentUser) {
              openCreateStoryModal();
            } else {
              openAuthModal('login');
            }
          }}
          className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 cursor-pointer shadow-xs hover:shadow-md transition-all group flex flex-col"
        >
          {/* Top user avatar preview */}
          <div className="h-32 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={
                currentUser?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
              }
              alt="Your Profile"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Plus icon circle */}
          <div className="absolute top-28 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-md group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>

          <div className="flex-1 flex items-end justify-center pb-2 px-1">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white text-center leading-tight">
              Create Story
            </span>
          </div>
        </div>

        {/* Existing Stories */}
        {stories.length === 0 ? (
          <div className="w-48 sm:w-56 h-44 sm:h-48 rounded-2xl bg-white border border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center shrink-0">
            <span className="text-xl mb-1.5">✨</span>
            <p className="text-xs font-bold text-slate-700">No active stories</p>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Stories shared by you or friends will appear here for 24 hours.
            </p>
          </div>
        ) : (
          stories.map((story) => {
            return (
              <div
                key={story.id}
                onClick={() => openStoryViewer(story.id)}
                className="relative w-28 sm:w-32 h-44 sm:h-48 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-xs hover:shadow-lg transition-all group select-none"
                style={{
                  background: story.backgroundGradient || '#1e293b'
                }}
              >
                {/* Media Background if image */}
                {story.mediaUrl && story.mediaType === 'image' && (
                  <img
                    src={story.mediaUrl}
                    alt={story.authorName}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}

                {/* Text content preview if text story */}
                {story.mediaType === 'text' && story.textContent && (
                  <div className="absolute inset-0 p-3 flex items-center justify-center text-center text-white text-xs font-bold leading-tight">
                    <span className="line-clamp-4">{story.textContent}</span>
                  </div>
                )}

                {/* Top gradient shadow for avatar */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70 pointer-events-none" />

                {/* Author Avatar with glowing blue ring */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <div className="w-9 h-9 rounded-full ring-2 ring-blue-500 ring-offset-2 ring-offset-black/40 overflow-hidden shadow-md">
                    <img
                      src={story.authorAvatar}
                      alt={story.authorName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Author Name */}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <div className="text-white text-xs font-bold truncate drop-shadow-md">
                    {story.authorName}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
