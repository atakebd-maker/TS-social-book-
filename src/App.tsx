import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { SidebarLeft } from './components/common/SidebarLeft';
import { SidebarRight } from './components/common/SidebarRight';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Toast } from './components/common/Toast';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';

import { FeedView } from './components/feed/FeedView';
import { ProfileView } from './components/profile/ProfileView';
import { FriendsView } from './components/friends/FriendsView';
import { GamesView } from './components/games/GamesView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { SavedPostsView } from './components/saved/SavedPostsView';
import { SearchView } from './components/search/SearchView';
import { ActivityLogView } from './components/activity/ActivityLogView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminPortalView } from './components/admin/AdminPortalView';

import { StoryViewerModal } from './components/feed/StoryViewerModal';
import { CreateStoryModal } from './components/feed/CreateStoryModal';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { ShareModal } from './components/feed/ShareModal';
import { EditPostModal } from './components/feed/EditPostModal';
import { ReportModal } from './components/feed/ReportModal';
import { MediaLightboxModal } from './components/feed/MediaLightboxModal';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main className="flex-1 min-w-0">
      {activeTab === 'feed' && <FeedView />}
      {activeTab === 'profile' && <ProfileView />}
      {activeTab === 'friends' && <FriendsView />}
      {activeTab === 'games' && <GamesView />}
      {activeTab === 'notifications' && <NotificationsView />}
      {activeTab === 'saved' && <SavedPostsView />}
      {activeTab === 'search' && <SearchView />}
      {activeTab === 'activity' && <ActivityLogView />}
      {activeTab === 'settings' && <SettingsView />}
      {activeTab === 'admin' && <AdminPortalView />}
    </main>
  );
};

const AppLayout: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const { activeTab } = useApp();

  // If loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading TS Social Book...</span>
        </div>
      </div>
    );
  }

  // Force Account Creation / Sign In on first open
  if (!currentUser) {
    return (
      <>
        <AuthScreen />
        <AuthModal />
        <Toast />
      </>
    );
  }

  // On full-width pages like Admin, Profile, or Settings we may expand layout
  const showRightSidebar = activeTab === 'feed';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header */}
      <Header />

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 lg:px-6 pt-4 sm:pt-6 flex gap-6">
        {/* Left Navigation Sidebar */}
        <SidebarLeft />

        {/* Dynamic Center Stage Content View */}
        <MainContent />

        {/* Right Widget Sidebar (Trending, Suggested, Shortcuts) */}
        {showRightSidebar && <SidebarRight />}
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Interactive Modals & Lightboxes */}
      <AuthModal />
      <StoryViewerModal />
      <CreateStoryModal />
      <CreatePostModal />
      <ShareModal />
      <EditPostModal />
      <ReportModal />
      <MediaLightboxModal />

      {/* Toast Notification Messenger */}
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </AuthProvider>
  );
}
