import {
  UserProfile,
  Post,
  Story,
  FriendRequest,
  AppNotification,
  ContentReport,
  ActivityLog,
  UserSettings
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_POSTS,
  INITIAL_COMMENTS,
  INITIAL_STORIES,
  INITIAL_FRIEND_REQUESTS,
  INITIAL_FRIENDSHIPS,
  INITIAL_FOLLOWS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SAVED_POSTS,
  INITIAL_BLOCKED_USERS,
  INITIAL_REPORTS,
  INITIAL_ACTIVITY_LOGS,
  getDefaultUserSettings
} from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'tssb_clean_users',
  CURRENT_USER_ID: 'tssb_clean_current_user_id',
  POSTS: 'tssb_clean_posts',
  COMMENTS: 'tssb_clean_comments',
  STORIES: 'tssb_clean_stories',
  FRIEND_REQUESTS: 'tssb_clean_friend_requests',
  FRIENDSHIPS: 'tssb_clean_friendships',
  FOLLOWS: 'tssb_clean_follows',
  NOTIFICATIONS: 'tssb_clean_notifications',
  SAVED_POSTS: 'tssb_clean_saved_posts',
  BLOCKED_USERS: 'tssb_clean_blocked_users',
  REPORTS: 'tssb_clean_reports',
  ACTIVITY_LOGS: 'tssb_clean_activity_logs',
  SETTINGS: 'tssb_clean_settings'
};

// Purge any legacy demo mock data keys from localStorage
try {
  const legacyKeys = [
    'tssb_users',
    'tssb_posts',
    'tssb_comments',
    'tssb_stories',
    'tssb_friend_requests',
    'tssb_friendships',
    'tssb_follows',
    'tssb_notifications',
    'tssb_saved_posts',
    'tssb_blocked_users',
    'tssb_reports',
    'tssb_activity_logs',
    'tssb_settings'
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch {
  // Ignore in SSR/restricted environments
}

function getStorageItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Error reading localStorage key ${key}:`, err);
    return fallback;
  }
}

function setStorageItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error writing localStorage key ${key}:`, err);
  }
}

// In-memory + localStorage reactive repository with empty starting structures
class LocalStore {
  users: UserProfile[] = getStorageItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  currentUserId: string = getStorageItem<string>(STORAGE_KEYS.CURRENT_USER_ID, '');
  posts: Post[] = getStorageItem(STORAGE_KEYS.POSTS, INITIAL_POSTS);
  comments: Record<string, import('../types').PostComment[]> = getStorageItem(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
  stories: Story[] = getStorageItem(STORAGE_KEYS.STORIES, INITIAL_STORIES);
  friendRequests: FriendRequest[] = getStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, INITIAL_FRIEND_REQUESTS);
  friendships: Record<string, string[]> = getStorageItem(STORAGE_KEYS.FRIENDSHIPS, INITIAL_FRIENDSHIPS);
  follows: Record<string, string[]> = getStorageItem(STORAGE_KEYS.FOLLOWS, INITIAL_FOLLOWS);
  notifications: AppNotification[] = getStorageItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  savedPosts: Record<string, string[]> = getStorageItem(STORAGE_KEYS.SAVED_POSTS, INITIAL_SAVED_POSTS);
  blockedUsers: Record<string, string[]> = getStorageItem(STORAGE_KEYS.BLOCKED_USERS, INITIAL_BLOCKED_USERS);
  reports: ContentReport[] = getStorageItem(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  activityLogs: ActivityLog[] = getStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
  settings: Record<string, UserSettings> = getStorageItem(STORAGE_KEYS.SETTINGS, {});

  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  saveUsers() {
    setStorageItem(STORAGE_KEYS.USERS, this.users);
    this.notify();
  }

  saveCurrentUserId(id: string) {
    this.currentUserId = id;
    setStorageItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    this.notify();
  }

  savePosts() {
    setStorageItem(STORAGE_KEYS.POSTS, this.posts);
    this.notify();
  }

  saveComments() {
    setStorageItem(STORAGE_KEYS.COMMENTS, this.comments);
    this.notify();
  }

  saveStories() {
    setStorageItem(STORAGE_KEYS.STORIES, this.stories);
    this.notify();
  }

  saveFriendRequests() {
    setStorageItem(STORAGE_KEYS.FRIEND_REQUESTS, this.friendRequests);
    this.notify();
  }

  saveFriendships() {
    setStorageItem(STORAGE_KEYS.FRIENDSHIPS, this.friendships);
    this.notify();
  }

  saveFollows() {
    setStorageItem(STORAGE_KEYS.FOLLOWS, this.follows);
    this.notify();
  }

  saveNotifications() {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  saveSavedPosts() {
    setStorageItem(STORAGE_KEYS.SAVED_POSTS, this.savedPosts);
    this.notify();
  }

  saveBlockedUsers() {
    setStorageItem(STORAGE_KEYS.BLOCKED_USERS, this.blockedUsers);
    this.notify();
  }

  saveReports() {
    setStorageItem(STORAGE_KEYS.REPORTS, this.reports);
    this.notify();
  }

  saveActivityLogs() {
    setStorageItem(STORAGE_KEYS.ACTIVITY_LOGS, this.activityLogs);
    this.notify();
  }

  saveSettings() {
    setStorageItem(STORAGE_KEYS.SETTINGS, this.settings);
    this.notify();
  }

  getUserSettings(userId: string): UserSettings {
    if (!this.settings[userId]) {
      this.settings[userId] = getDefaultUserSettings(userId);
      this.saveSettings();
    }
    return this.settings[userId];
  }
}

export const localStore = new LocalStore();
