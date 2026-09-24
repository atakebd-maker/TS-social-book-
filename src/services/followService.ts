/**
 * TS Social Book - Follow Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Followers and following can be queried in separate collections or subcollections:
 *   - collection(db, "users", userId, "followers")
 *   - collection(db, "users", userId, "following")
 * ============================================================================
 */

import { UserProfile } from '../types';
import { localStore } from './localStore';
import { notificationService } from './notificationService';
import { activityService } from './activityService';

export const followService = {
  async isFollowing(currentUserId: string, targetUserId: string): Promise<boolean> {
    const list = localStore.follows[currentUserId] || [];
    return list.includes(targetUserId);
  },

  async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    const following = await this.isFollowing(currentUserId, targetUserId);
    if (following) {
      await this.unfollowUser(currentUserId, targetUserId);
      return false;
    } else {
      const user = localStore.users.find((u) => u.id === currentUserId);
      if (user) {
        await this.followUser(
          {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar
          },
          targetUserId
        );
      }
      return true;
    }
  },

  async followUser(
    currentUser: { id: string; name: string; username: string; avatar: string },
    targetUserId: string
  ): Promise<void> {
    if (currentUser.id === targetUserId) return;

    if (!localStore.follows[currentUser.id]) {
      localStore.follows[currentUser.id] = [];
    }

    if (!localStore.follows[currentUser.id].includes(targetUserId)) {
      localStore.follows[currentUser.id].push(targetUserId);
      localStore.saveFollows();

      // Update following count on current user
      const curr = localStore.users.find((u) => u.id === currentUser.id);
      if (curr) curr.followingCount = localStore.follows[currentUser.id].length;

      // Update followers count on target user
      const target = localStore.users.find((u) => u.id === targetUserId);
      if (target) {
        // Count who follows target
        let count = 0;
        Object.values(localStore.follows).forEach((arr) => {
          if (arr.includes(targetUserId)) count++;
        });
        target.followersCount = count;

        // Send notification
        await notificationService.addNotification({
          userId: targetUserId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderUsername: currentUser.username,
          senderAvatar: currentUser.avatar,
          type: 'follow',
          title: 'New Follower',
          message: `${currentUser.name} is now following your public activity.`,
          targetId: currentUser.id,
          targetType: 'profile'
        });
      }

      localStore.saveUsers();

      // Activity log
      await activityService.logActivity({
        userId: currentUser.id,
        type: 'followed_user',
        title: 'Followed a user',
        description: `Started following ${target?.name || 'a user'}`,
        targetId: targetUserId
      });
    }
  },

  async unfollowUser(currentUserId: string, targetUserId: string): Promise<void> {
    if (!localStore.follows[currentUserId]) return;

    localStore.follows[currentUserId] = localStore.follows[currentUserId].filter((id) => id !== targetUserId);
    localStore.saveFollows();

    const curr = localStore.users.find((u) => u.id === currentUserId);
    if (curr) curr.followingCount = localStore.follows[currentUserId].length;

    const target = localStore.users.find((u) => u.id === targetUserId);
    if (target) {
      let count = 0;
      Object.values(localStore.follows).forEach((arr) => {
        if (arr.includes(targetUserId)) count++;
      });
      target.followersCount = count;
    }

    localStore.saveUsers();
  },

  async getFollowers(userId: string): Promise<UserProfile[]> {
    const followerIds: string[] = [];
    Object.entries(localStore.follows).forEach(([fId, followingList]) => {
      if (followingList.includes(userId)) {
        followerIds.push(fId);
      }
    });
    return localStore.users.filter((u) => followerIds.includes(u.id));
  },

  async getFollowing(userId: string): Promise<UserProfile[]> {
    const ids = localStore.follows[userId] || [];
    return localStore.users.filter((u) => ids.includes(u.id));
  }
};
