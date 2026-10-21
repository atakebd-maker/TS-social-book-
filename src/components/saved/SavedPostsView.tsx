import React, { useState, useEffect } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';
import { Post } from '../../types';
import { PostCard } from '../feed/PostCard';

export const SavedPostsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshKey, triggerRefresh, showToast } = useApp();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSaved = async () => {
    if (!currentUser) return;
    setLoading(true);
    const posts = await postService.getSavedPosts(currentUser.id);
    setSavedPosts(posts);
    setLoading(false);
  };

  useEffect(() => {
    loadSaved();
  }, [currentUser?.id]);

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-blue-600 fill-current" />
          <span>Saved Posts</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Everything you saved for later reference. Only visible to you.
        </p>
      </div>

      {/* Posts Stream */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading saved items...</div>
      ) : savedPosts.length > 0 ? (
        <div className="space-y-4">
          {savedPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-10 text-center">
          <Bookmark className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No saved posts yet.
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click the bookmark icon on any post in your feed to save it here for easy access.
          </p>
        </div>
      )}
    </div>
  );
};
