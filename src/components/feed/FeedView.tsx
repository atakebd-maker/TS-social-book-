import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Users, User, X, Hash, Video, Plus, MessageSquare, QrCode, ExternalLink, Layers } from 'lucide-react';
import { StoriesSection } from './StoriesSection';
import { CreatePostCard } from './CreatePostCard';
import { PostCard } from './PostCard';
import { postService } from '../../services/postService';
import { Post } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { openQrCodeTools } from '../../utils/adDownloadManager';

export const FeedView: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedHashtag, navigateToFeed, refreshKey, openCreatePostModal } = useApp();

  const [posts, setPosts] = useState<Post[]>([]);
  const [filterMode, setFilterMode] = useState<'recent' | 'popular' | 'videos' | 'mine'>('recent');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    setLoading(true);
    let list: Post[] = [];

    if (selectedHashtag) {
      list = await postService.getPostsByHashtag(selectedHashtag);
    } else if (filterMode === 'mine' && currentUser) {
      list = await postService.getUserPosts(currentUser.id);
    } else {
      list = await postService.getFeedPosts(currentUser?.id, 50);
      if (filterMode === 'popular') {
        list.sort((a, b) => {
          const totalA = Object.values(a.reactionsCount || {}).reduce((x, y) => x + y, 0);
          const totalB = Object.values(b.reactionsCount || {}).reduce((x, y) => x + y, 0);
          return totalB - totalA;
        });
      } else if (filterMode === 'videos') {
        list = list.filter((p) => p.media && p.media.some((m) => m.type === 'video'));
      }
    }

    setPosts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();

    // Real-time synchronization across all devices and mobile phones
    const unsubscribe = postService.subscribeToPosts(() => {
      loadFeed();
    });

    return () => {
      unsubscribe();
    };
  }, [filterMode, selectedHashtag, currentUser, refreshKey]);

  const visiblePosts = posts.filter((p) => !hiddenPostIds.includes(p.id));

  return (
    <div className="w-full max-w-2xl mx-auto pb-12">
      {/* Active Hashtag Filter Banner */}
      {selectedHashtag ? (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-sm font-bold text-blue-950 dark:text-blue-200">
                Posts tagged {selectedHashtag}
              </h2>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {visiblePosts.length} post{visiblePosts.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>
          <button
            onClick={navigateToFeed}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-100 flex items-center gap-1 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      ) : (
        <>
          {/* Stories Bar */}
          <StoriesSection />

          {/* Create Post Card */}
          <CreatePostCard />

          {/* Categories Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-3">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>

            <button
              onClick={openQrCodeTools}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm flex items-center gap-1.5 group shrink-0"
              title="Open QR code tools (tsquickqr.netlify.app)"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR code tools</span>
              <span className="text-[10px] bg-white/25 px-1 rounded-sm">↗</span>
            </button>

            {['Technology', 'Entertainment', 'Gaming', 'Lifestyle', 'Education'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feed Filter Segmented Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 mb-4 shadow-xs">
            <button
              onClick={() => setFilterMode('recent')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                filterMode === 'recent'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>

            <button
              onClick={() => setFilterMode('popular')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                filterMode === 'popular'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Popular</span>
            </button>

            <button
              onClick={() => setFilterMode('videos')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                filterMode === 'videos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Videos</span>
            </button>

            {currentUser && (
              <button
                onClick={() => setFilterMode('mine')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  filterMode === 'mine'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>My Posts</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Posts Stream */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-1.5 flex-1">
                  <div className="w-32 h-3.5 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="w-20 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-xl mb-3" />
              <div className="w-full h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : visiblePosts.length > 0 ? (
        <div className="space-y-4">
          {visiblePosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onHide={() => setHiddenPostIds((prev) => [...prev, post.id])}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {filterMode === 'videos' ? 'No video posts yet' : 'No posts in feed yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            {filterMode === 'videos'
              ? 'Be the first to share an engaging video with your friends and followers!'
              : 'Share what is on your mind, upload photos, or publish videos to start the conversation!'}
          </p>
          <div className="mt-5">
            <button
              onClick={openCreatePostModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Post</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
