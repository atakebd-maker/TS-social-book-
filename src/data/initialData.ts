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

/**
 * Empty initial data structures - zero hard-coded mock/demo data.
 * All application content is created and persisted dynamically by real users.
 */

export const INITIAL_USERS: UserProfile[] = [];

export const INITIAL_POSTS: Post[] = [];

export const INITIAL_COMMENTS: Record<string, import('../types').PostComment[]> = {};

export const INITIAL_STORIES: Story[] = [];

export const INITIAL_FRIEND_REQUESTS: FriendRequest[] = [];

export const INITIAL_FRIENDSHIPS: Record<string, string[]> = {};

export const INITIAL_FOLLOWS: Record<string, string[]> = {};

export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const INITIAL_SAVED_POSTS: Record<string, string[]> = {};

export const INITIAL_BLOCKED_USERS: Record<string, string[]> = {};

export const INITIAL_REPORTS: ContentReport[] = [];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];

export const getDefaultUserSettings = (userId: string): UserSettings => ({
  userId,
  defaultPostPrivacy: 'public',
  whoCanSendFriendRequests: 'everyone',
  whoCanFollowMe: 'everyone',
  searchEngineIndexing: true,
  showActivityStatus: true,
  allowTagging: true,
  notifyReactions: true,
  notifyComments: true,
  notifyFriendRequests: true,
  notifyFollows: true,
  notifyMentions: true,
  theme: 'light',
  denseFeed: false,
  twoFactorEnabled: false
});

export const DEFAULT_USER_SETTINGS: UserSettings = getDefaultUserSettings('');
