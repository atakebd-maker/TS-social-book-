import React from 'react';
import { Home, Users, Plus, Bell, User, Gamepad2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const {
    activeTab,
    setActiveTab,
    navigateToFeed,
    navigateToGames,
    navigateToProfile,
    unreadNotificationsCount,
    pendingRequestsCount,
    openCreatePostModal
  } = useApp();

  const handleCreateTapped = () => {
    if (!currentUser) {
      openAuthModal('signup');
      return;
    }
    openCreatePostModal();
  };

  const navButton = (isActive: boolean) =>
    `flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
      isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 flex items-center justify-around shadow-lg">
      {/* 1. Home Feed */}
      <button
        onClick={navigateToFeed}
        className={navButton(activeTab === 'feed')}
        aria-label="Feed"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Feed</span>
      </button>

      {/* 2. Friends */}
      <button
        onClick={() => setActiveTab('friends')}
        className={`relative ${navButton(activeTab === 'friends')}`}
        aria-label="Friends"
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Friends</span>
        {pendingRequestsCount > 0 && (
          <span className="absolute top-1 right-3 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {pendingRequestsCount}
          </span>
        )}
      </button>

      {/* 3. Create Action (+) */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={handleCreateTapped}
          className="w-11 h-11 -mt-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/35 active:scale-95 transition-transform"
          aria-label="Create Post or Story"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Games */}
      <button
        onClick={navigateToGames}
        className={navButton(activeTab === 'games')}
        aria-label="Games"
      >
        <Gamepad2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Games</span>
      </button>

      {/* 5. Alerts / Profile */}
      <button
        onClick={() => {
          if (currentUser) {
            navigateToProfile(currentUser.id);
          } else {
            openAuthModal('login');
          }
        }}
        className={navButton(activeTab === 'profile')}
        aria-label="Profile"
      >
        {currentUser ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-500"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-[10px] mt-0.5">Profile</span>
      </button>
    </nav>
  );
};
