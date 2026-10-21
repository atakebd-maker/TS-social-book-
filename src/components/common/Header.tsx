import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Home,
  Users,
  Bell,
  Bookmark,
  Plus,
  ShieldAlert,
  LogOut,
  User,
  Activity,
  Settings as SettingsIcon,
  ChevronDown,
  Sparkles,
  X,
  Gamepad2,
  QrCode,
  ExternalLink
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { userService } from '../../services/userService';
import { UserProfile } from '../../types';
import { openQrCodeTools } from '../../utils/adDownloadManager';

export const Header: React.FC = () => {
  const { currentUser, logout, openAuthModal } = useAuth();
  const {
    activeTab,
    setActiveTab,
    navigateToFeed,
    navigateToGames,
    navigateToProfile,
    unreadNotificationsCount,
    pendingRequestsCount,
    searchQuery,
    setSearchQuery,
    navigateToSearch,
    openCreateStoryModal,
    openCreatePostModal
  } = useApp();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<UserProfile[]>([]);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setCreateDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle live search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      userService.searchUsers(searchQuery).then((results) => {
        setSearchSuggestions(results.slice(0, 5));
      });
    } else {
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchFocused(false);
      navigateToSearch(searchQuery.trim());
    }
  };

  const navItemClass = (tabName: string) => {
    const isActive = activeTab === tabName;
    return `relative flex items-center justify-center h-12 px-5 rounded-xl transition-all duration-150 font-medium ${
      isActive
        ? 'text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.75 after:bg-blue-600 dark:after:bg-blue-400 after:rounded-full'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
    }`;
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Global Search */}
        <div className="flex items-center gap-4 flex-1 md:flex-initial">
          <BrandLogo onClick={navigateToFeed} />

          {/* Search Box */}
          <div ref={searchContainerRef} className="relative hidden sm:block w-64 lg:w-72">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search people, #tags, posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="w-full pl-10 pr-9 py-2 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 rounded-full border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Suggestions Dropdown */}
            {searchFocused && (searchSuggestions.length > 0 || searchQuery.trim().length > 0) && (
              <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  People & Accounts
                </div>
                {searchSuggestions.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => {
                      setSearchFocused(false);
                      navigateToProfile(user.id);
                    }}
                    className="flex items-center gap-3 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate flex items-center gap-1">
                        {user.name}
                        {user.isVerified && (
                          <span className="text-blue-500 text-xs font-bold">✓</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                    </div>
                  </div>
                ))}

                {searchQuery.trim().length > 0 && (
                  <div
                    onClick={() => {
                      setSearchFocused(false);
                      navigateToSearch(searchQuery);
                    }}
                    className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800 px-3.5 py-2 text-sm text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search all for "{searchQuery}"</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (NO MESSENGER) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center max-w-md">
          <button
            onClick={navigateToFeed}
            className={navItemClass('feed')}
            title="Home Feed"
            aria-label="Home Feed"
          >
            <Home className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTab('friends')}
            className={navItemClass('friends')}
            title="Friends & Requests"
            aria-label="Friends & Requests"
          >
            <Users className="w-5 h-5" />
            {pendingRequestsCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={navItemClass('notifications')}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4.5 h-4.5 px-1 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={navItemClass('saved')}
            title="Saved Posts"
            aria-label="Saved Posts"
          >
            <Bookmark className="w-5 h-5" />
          </button>

          <button
            onClick={navigateToGames}
            className={navItemClass('games')}
            title="Games Center"
            aria-label="Games Center"
          >
            <Gamepad2 className="w-5 h-5" />
          </button>

          <button
            onClick={openQrCodeTools}
            className="relative flex items-center justify-center h-12 px-4 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 transition-all font-semibold text-xs gap-1.5"
            title="QR code tools (tsquickqr.netlify.app)"
            aria-label="QR code tools"
          >
            <QrCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">QR code tools</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded font-bold">↗</span>
          </button>
        </nav>

        {/* Right: Quick actions, Theme, Profile Dropdown */}
        <div className="flex items-center gap-2.5">
          {/* Quick Create Button */}
          <button
            onClick={() => {
              if (!currentUser) {
                openAuthModal('signup');
              } else {
                openCreatePostModal();
              }
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Create Post or Story"
            aria-label="Create Post"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* User Account / Profile Menu */}
          {currentUser ? (
            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                aria-label="User Menu"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500"
                />
                <span className="hidden lg:inline text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-28 truncate">
                  {currentUser.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* User Profile Card Header */}
                  <div
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigateToProfile(currentUser.id);
                    }}
                    className="px-4 py-3 mx-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/60 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center gap-3"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {currentUser.name}
                        {currentUser.role === 'admin' && (
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-extrabold tracking-wide uppercase">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">@{currentUser.username}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        View your profile
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                  {/* Navigation Links */}
                  <div className="px-2 space-y-0.5">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigateToProfile(currentUser.id);
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-slate-500" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('activity');
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2.5"
                    >
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span>Activity Log</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('settings');
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2.5"
                    >
                      <SettingsIcon className="w-4 h-4 text-slate-500" />
                      <span>Settings & Privacy</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        openQrCodeTools();
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <QrCode className="w-4 h-4 text-blue-600" />
                        <span>QR code tools</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                    </button>

                    {/* Admin Portal Link */}
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setActiveTab('admin');
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg flex items-center gap-2.5"
                    >
                      <ShieldAlert className="w-4 h-4 text-indigo-500" />
                      <span>Admin Management Portal</span>
                    </button>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />

                  {/* Logout */}
                  <div className="px-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-sm shadow-blue-500/30 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
