/**
 * TS Social Book - Settings Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * User preferences can be saved to Firestore under `users/{userId}/settings/preferences`
 * or inside the primary user document.
 * ============================================================================
 */

import { UserSettings } from '../types';
import { localStore } from './localStore';
import { DEFAULT_USER_SETTINGS } from '../data/initialData';

export const settingsService = {
  async getUserSettings(userId: string): Promise<UserSettings> {
    const existing = localStore.settings[userId];
    if (existing) return existing;

    const defaults: UserSettings = {
      ...DEFAULT_USER_SETTINGS,
      userId
    };
    localStore.settings[userId] = defaults;
    localStore.saveSettings();
    return defaults;
  },

  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getUserSettings(userId);
    const updated: UserSettings = {
      ...current,
      ...updates
    };

    localStore.settings[userId] = updated;
    localStore.saveSettings();
    return updated;
  },

  async deactivateAccount(userId: string): Promise<void> {
    const user = localStore.users.find((u) => u.id === userId);
    if (user) {
      user.status = 'suspended';
      localStore.saveUsers();
    }
  },

  async deleteAccount(userId: string): Promise<void> {
    // Delete user from list, delete posts, comments, etc.
    localStore.users = localStore.users.filter((u) => u.id !== userId);
    localStore.posts = localStore.posts.filter((p) => p.authorId !== userId);
    delete localStore.settings[userId];
    delete localStore.friendships[userId];
    delete localStore.follows[userId];
    delete localStore.savedPosts[userId];
    localStore.saveUsers();
    localStore.savePosts();
    localStore.saveSettings();
    localStore.saveFriendships();
    localStore.saveFollows();
  }
};
