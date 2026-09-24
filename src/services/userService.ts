/**
 * TS Social Book - User Service
 * Powered by Cloud Firestore & local cache
 */

import { doc, getDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';
import { localStore } from './localStore';

export const userService = {
  async getUser(userId: string): Promise<UserProfile | null> {
    const cached = localStore.users.find((u) => u.id === userId);
    if (cached) return cached;

    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const user = snap.data() as UserProfile;
        localStore.users.push(user);
        localStore.saveUsers();
        return user;
      }
    } catch (err) {
      console.warn('Failed to fetch user from Firestore:', err);
    }

    return null;
  },

  async getUserById(userId: string): Promise<UserProfile | null> {
    return this.getUser(userId);
  },

  async isBlocked(currentUserId: string, targetUserId: string): Promise<boolean> {
    const current = localStore.blockedUsers[currentUserId] || [];
    return current.includes(targetUserId);
  },

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const clean = username.replace(/^@/, '').toLowerCase();
    const cached = localStore.users.find((u) => u.username.toLowerCase() === clean);
    if (cached) return cached;

    try {
      const all = await this.getAllUsers();
      return all.find((u) => u.username.toLowerCase() === clean) || null;
    } catch {
      return null;
    }
  },

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        const remoteUsers = snap.docs.map((d) => d.data() as UserProfile);
        const map = new Map<string, UserProfile>();
        remoteUsers.forEach((u) => map.set(u.id, u));
        localStore.users.forEach((u) => {
          if (!map.has(u.id)) map.set(u.id, u);
        });
        localStore.users = Array.from(map.values());
        localStore.saveUsers();
        return localStore.users;
      }
    } catch (err) {
      console.warn('Failed to fetch all users from Firestore:', err);
    }
    return [...localStore.users];
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const index = localStore.users.findIndex((u) => u.id === userId);
    const existing = index !== -1 ? localStore.users[index] : null;

    const updated: UserProfile = {
      ...(existing || {
        id: userId,
        name: 'User',
        username: 'user',
        email: '',
        avatar: '',
        coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
        bio: '',
        role: 'user' as const,
        status: 'active' as const,
        joinedDate: 'Recently',
        friendsCount: 0,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0
      }),
      ...updates
    };

    if (index !== -1) {
      localStore.users[index] = updated;
    } else {
      localStore.users.push(updated);
    }
    localStore.saveUsers();

    try {
      await updateDoc(doc(db, 'users', userId), updates);
    } catch (err) {
      console.warn('Failed to update profile in Firestore:', err);
    }

    // Also cascade author name/avatar updates to posts by this author
    let postsChanged = false;
    localStore.posts = localStore.posts.map((post) => {
      if (post.authorId === userId) {
        postsChanged = true;
        return {
          ...post,
          authorName: updated.name,
          authorUsername: updated.username,
          authorAvatar: updated.avatar
        };
      }
      return post;
    });

    if (postsChanged) {
      localStore.savePosts();
    }

    return updated;
  },

  async getSuggestedUsers(currentUserId: string, limit = 5): Promise<UserProfile[]> {
    const currentFriends = localStore.friendships[currentUserId] || [];
    const blocked = localStore.blockedUsers[currentUserId] || [];

    return localStore.users
      .filter((u) => u.id !== currentUserId && !currentFriends.includes(u.id) && !blocked.includes(u.id))
      .slice(0, limit);
  },

  async blockUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (!localStore.blockedUsers[currentUserId]) {
      localStore.blockedUsers[currentUserId] = [];
    }
    if (!localStore.blockedUsers[currentUserId].includes(targetUserId)) {
      localStore.blockedUsers[currentUserId].push(targetUserId);
      localStore.saveBlockedUsers();
    }
  },

  async unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (localStore.blockedUsers[currentUserId]) {
      localStore.blockedUsers[currentUserId] = localStore.blockedUsers[currentUserId].filter(
        (id) => id !== targetUserId
      );
      localStore.saveBlockedUsers();
    }
  },

  async searchUsers(query: string, limit = 10): Promise<UserProfile[]> {
    const clean = query.trim().toLowerCase();
    if (!clean) return [];

    return localStore.users
      .filter(
        (u) =>
          u.name.toLowerCase().includes(clean) ||
          u.username.toLowerCase().includes(clean) ||
          u.email.toLowerCase().includes(clean)
      )
      .slice(0, limit);
  }
};
