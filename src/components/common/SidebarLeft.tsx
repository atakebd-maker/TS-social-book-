import React from 'react';
import {
  Home,
  Users,
  Bell,
  Bookmark,
  Activity,
  Settings as SettingsIcon,
  ShieldAlert,
  Hash,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const SidebarLeft: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    activeTab,
    setActiveTab,
    navigateToFeed,
    navigateToGames,
    navigateToProfile,
    navigateToHashtag,
    unreadNotificationsCount,
    pendingRequestsCount,
    selectedHashtag
  } = useApp();

  const menuItems = [
    {
      id: 'feed',
      label: 'Home Feed',
      icon: Home,
      action: navigateToFeed,
      badge: 0
    },
    {
      id: 'friends',
      label: 'Friends & Community',
      icon: Users,
      action: () => setActiveTab('friends'),
      badge: pendingRequestsCount
    },
    {
      id: 'games',
      label: 'Games Center',
      icon: Gamepad2,
      action: navigateToGames,
      badge: 0
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      action: () => setActiveTab('notifications'),
      badge: unreadNotificationsCount
    },
    {
      id: 'saved',
      label: 'Saved Bookmarks',
      icon: Bookmark,
      action: () => setActiveTab('saved'),
      badge: 0
    },
    {
      id: 'activity',
      label: 'Activity Log',
      icon: Activity,
      action: () => setActiveTab('activity'),
      badge: 0
    },
    {
      id: 'settings',
      label: 'Settings & Privacy',
      icon: SettingsIcon,
      action: () => setActiveTab('settings'),
      badge: 0
    },
    {
      id: 'admin',
      label: 'Admin Portal',
      icon: ShieldAlert,
      action: () => setActiveTab('admin'),
      badge: 0,
      highlight: true
    }
  ];

  const popularHashtags = [
    { tag: 'Technology', count: '1.2k posts' },
    { tag: 'Bangladesh', count: '890 posts' },
    { tag: 'TSsocialbook', count: '2.5k posts' },
    { tag: 'WebDev', count: '640 posts' },
    { tag: 'Design', count: '480 posts' },
    { tag: 'Photography', count: '920 posts' }
  ];

  return (
    <aside className="hidden lg:block w-64 shrink-0 space-y-5 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar">
      {/* Current User Quick Summary */}
      {currentUser && (
        <div
          onClick={() => navigateToProfile(currentUser.id)}
          className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 group flex items-center gap-3"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500/80 group-hover:scale-105 transition-transform"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentUser.name}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 truncate">@{currentUser.username}</p>
          </div>
        </div>
      )}

      {/* Main Navigation Links */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-sm space-y-0.5">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id && !selectedHashtag;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/25'
                  : item.highlight
                  ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4.5 h-4.5 ${
                    isActive ? 'text-white' : item.highlight ? 'text-indigo-500' : 'text-slate-500 dark:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Popular Hashtags */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Trending Hashtags</span>
        </div>
        <div className="space-y-1">
          {popularHashtags.map(({ tag, count }) => {
            const isSelected = selectedHashtag?.toLowerCase() === `#${tag.toLowerCase()}`;
            return (
              <button
                key={tag}
                onClick={() => navigateToHashtag(`#${tag}`)}
                className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium truncate">
                  <Hash className="w-3 h-3 text-blue-500" />
                  <span className="truncate">#{tag}</span>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 shrink-0">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-3 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <button onClick={() => setActiveTab('settings')} className="hover:underline">Privacy</button>
          <span>•</span>
          <button onClick={() => setActiveTab('settings')} className="hover:underline">Terms</button>
          <span>•</span>
          <button onClick={() => setActiveTab('admin')} className="hover:underline">Moderation</button>
        </div>
        <div>TS Social Book © 2026. All rights reserved.</div>
      </div>
    </aside>
  );
};
