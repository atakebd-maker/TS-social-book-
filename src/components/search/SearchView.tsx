import React, { useState, useEffect } from 'react';
import { Search, User, FileText, Hash, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { userService } from '../../services/userService';
import { postService } from '../../services/postService';
import { UserProfile, Post } from '../../types';
import { PostCard } from '../feed/PostCard';

export const SearchView: React.FC = () => {
  const { searchQuery, setSearchQuery, navigateToProfile, navigateToHashtag } = useApp();
  const [filter, setFilter] = useState<'all' | 'people' | 'posts'>('all');
  const [matchedUsers, setMatchedUsers] = useState<UserProfile[]>([]);
  const [matchedPosts, setMatchedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setMatchedUsers([]);
      setMatchedPosts([]);
      return;
    }
    setLoading(true);

    const [users, posts] = await Promise.all([
      userService.searchUsers(searchQuery),
      postService.searchPosts(searchQuery)
    ]);

    setMatchedUsers(users);
    setMatchedPosts(posts);
    setLoading(false);
  };

  useEffect(() => {
    performSearch();
  }, [searchQuery]);

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Search Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <h1 className="text-xl font-black text-slate-900 dark:text-white mb-3">
          Search TS Social Book
        </h1>

        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords, names, or #hashtags..."
            className="w-full pl-11 pr-10 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All Results ({matchedUsers.length + matchedPosts.length})
          </button>
          <button
            onClick={() => setFilter('people')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              filter === 'people'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            People ({matchedUsers.length})
          </button>
          <button
            onClick={() => setFilter('posts')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
              filter === 'posts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Posts ({matchedPosts.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Searching...</div>
      ) : (
        <div className="space-y-6">
          {/* People Section */}
          {(filter === 'all' || filter === 'people') && matchedUsers.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>People & Accounts</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => navigateToProfile(user.id)}
                    className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 cursor-pointer transition-all flex items-center gap-3 group"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {user.name}
                        {user.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {user.work || user.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(filter === 'all' || filter === 'posts') && matchedPosts.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>Matching Posts</span>
              </h2>
              <div className="space-y-4">
                {matchedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {matchedUsers.length === 0 && matchedPosts.length === 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching results found for "{searchQuery}".
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with different keywords or popular hashtags like #Technology or #TSsocialbook.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
