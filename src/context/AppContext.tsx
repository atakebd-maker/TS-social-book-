import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, ContentReport } from '../types';
import { notificationService } from '../services/notificationService';
import { friendService } from '../services/friendService';
import { useAuth } from './AuthContext';
import { localStore } from '../services/localStore';

export type AppTab =
  | 'feed'
  | 'friends'
  | 'games'
  | 'notifications'
  | 'saved'
  | 'activity'
  | 'settings'
  | 'admin'
  | 'search'
  | 'profile';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface AppContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedProfileUserId: string | null;
  selectedHashtag: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadNotificationsCount: number;
  pendingRequestsCount: number;
  
  // Navigation helpers
  navigateToProfile: (userId: string) => void;
  navigateToFeed: () => void;
  navigateToGames: () => void;
  navigateToHashtag: (hashtag: string) => void;
  navigateToSearch: (initialQuery?: string) => void;
  
  // Modals
  activeStoryId: string | null;
  openStoryViewer: (storyId: string) => void;
  closeStoryViewer: () => void;

  createPostModalOpen: boolean;
  openCreatePostModal: () => void;
  closeCreatePostModal: () => void;
  
  createStoryModalOpen: boolean;
  openCreateStoryModal: () => void;
  closeCreateStoryModal: () => void;
  
  postToShare: Post | null;
  openShareModal: (post: Post) => void;
  closeShareModal: () => void;
  
  postToEdit: Post | null;
  openEditPostModal: (post: Post) => void;
  closeEditPostModal: () => void;
  
  reportTarget: {
    type: 'post' | 'comment' | 'profile' | 'story';
    id: string;
    authorName: string;
    snippet?: string;
  } | null;
  openReportModal: (target: NonNullable<AppContextType['reportTarget']>) => void;
  closeReportModal: () => void;

  mediaLightbox: { url: string; type: 'image' | 'video'; caption?: string } | null;
  openMediaLightbox: (media: { url: string; type: 'image' | 'video'; caption?: string }) => void;
  closeMediaLightbox: () => void;

  // Toast
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;

  // Force re-render signal for components listening to localStore
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Clear any residual dark mode class
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('tssb_dark_mode');
  }, []);

  // Sync unread counts
  const updateCounts = async () => {
    if (!currentUser) {
      setUnreadNotificationsCount(0);
      setPendingRequestsCount(0);
      return;
    }
    const unread = await notificationService.getUnreadCount(currentUser.id);
    const reqs = await friendService.getPendingRequests(currentUser.id);
    setUnreadNotificationsCount(unread);
    setPendingRequestsCount(reqs.length);
  };

  useEffect(() => {
    updateCounts();
    const unsub = localStore.subscribe(() => {
      updateCounts();
      setRefreshKey((k) => k + 1);
    });
    return () => {
      unsub();
    };
  }, [currentUser]);

  // Modals state
  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [createStoryModalOpen, setCreateStoryModalOpen] = useState(false);
  const [postToShare, setPostToShare] = useState<Post | null>(null);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);
  const [reportTarget, setReportTarget] = useState<AppContextType['reportTarget']>(null);
  const [mediaLightbox, setMediaLightbox] = useState<{ url: string; type: 'image' | 'video'; caption?: string } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigators
  const navigateToProfile = (userId: string) => {
    setSelectedProfileUserId(userId);
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFeed = () => {
    setSelectedHashtag(null);
    setSelectedProfileUserId(null);
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToGames = () => {
    setSelectedHashtag(null);
    setSelectedProfileUserId(null);
    setActiveTab('games');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToHashtag = (hashtag: string) => {
    setSelectedHashtag(hashtag);
    setActiveTab('feed');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToSearch = (initialQuery = '') => {
    if (initialQuery) setSearchQuery(initialQuery);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedProfileUserId,
        selectedHashtag,
        searchQuery,
        setSearchQuery,
        unreadNotificationsCount,
        pendingRequestsCount,
        navigateToProfile,
        navigateToFeed,
        navigateToGames,
        navigateToHashtag,
        navigateToSearch,
        activeStoryId,
        openStoryViewer: (id) => setActiveStoryId(id),
        closeStoryViewer: () => setActiveStoryId(null),
        createPostModalOpen,
        openCreatePostModal: () => setCreatePostModalOpen(true),
        closeCreatePostModal: () => setCreatePostModalOpen(false),
        createStoryModalOpen,
        openCreateStoryModal: () => setCreateStoryModalOpen(true),
        closeCreateStoryModal: () => setCreateStoryModalOpen(false),
        postToShare,
        openShareModal: (post) => setPostToShare(post),
        closeShareModal: () => setPostToShare(null),
        postToEdit,
        openEditPostModal: (post) => setPostToEdit(post),
        closeEditPostModal: () => setPostToEdit(null),
        reportTarget,
        openReportModal: (target) => setReportTarget(target),
        closeReportModal: () => setReportTarget(null),
        mediaLightbox,
        openMediaLightbox: (m) => setMediaLightbox(m),
        closeMediaLightbox: () => setMediaLightbox(null),
        toasts,
        showToast,
        dismissToast,
        refreshKey,
        triggerRefresh: () => setRefreshKey((k) => k + 1)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
