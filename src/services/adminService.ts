/**
 * TS Social Book - Admin Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Secured via Custom User Claims (`request.auth.token.role == 'admin'`)
 * or Firestore Admin verification rules.
 * ============================================================================
 */

import { UserProfile, UserRole, UserStatus, Post, ContentReport, Story } from '../types';
import { localStore } from './localStore';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  totalReports: number;
  pendingReports: number;
  totalStories: number;
  storageUsageMb: number;
}

export const adminService = {
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const totalUsers = localStore.users.length;
    const activeUsers = localStore.users.filter((u) => u.status === 'active').length;
    const totalPosts = localStore.posts.length;

    let totalComments = 0;
    Object.values(localStore.comments).forEach((cList) => {
      totalComments += cList.length;
      cList.forEach((c) => {
        totalComments += c.replies?.length || 0;
      });
    });

    let totalReactions = 0;
    localStore.posts.forEach((p) => {
      if (p.reactionsCount) {
        totalReactions += Object.values(p.reactionsCount).reduce((acc, v) => acc + v, 0);
      }
    });

    const totalReports = localStore.reports.length;
    const pendingReports = localStore.reports.filter((r) => r.status === 'pending').length;
    const totalStories = localStore.stories.length;

    return {
      totalUsers,
      activeUsers,
      totalPosts,
      totalComments,
      totalReactions,
      totalReports,
      pendingReports,
      totalStories,
      storageUsageMb: Math.round((totalPosts * 0.4 + totalStories * 0.8 + totalUsers * 0.05) * 10) / 10
    };
  },

  async getAllUsers(): Promise<UserProfile[]> {
    return [...localStore.users];
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const user = localStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.role = role;
    localStore.saveUsers();
  },

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    const user = localStore.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    localStore.saveUsers();
  },

  async getAllPosts(): Promise<Post[]> {
    return [...localStore.posts];
  },

  async deletePostAsAdmin(postId: string): Promise<void> {
    localStore.posts = localStore.posts.filter((p) => p.id !== postId);
    localStore.savePosts();
  },

  async getAllStories(): Promise<Story[]> {
    return [...localStore.stories];
  },

  async deleteStoryAsAdmin(storyId: string): Promise<void> {
    localStore.stories = localStore.stories.filter((s) => s.id !== storyId);
    localStore.saveStories();
  },

  async getAllReports(): Promise<ContentReport[]> {
    return [...localStore.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
};
