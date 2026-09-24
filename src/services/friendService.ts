/**
 * TS Social Book - Friend Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Friendships and requests can be stored in `friendships` and `friendRequests`:
 *   - collection(db, "friendRequests")
 *   - query(..., where("receiverId", "==", userId), where("status", "==", "pending"))
 * ============================================================================
 */

import { FriendRequest, UserProfile } from '../types';
import { localStore } from './localStore';
import { notificationService } from './notificationService';
import { activityService } from './activityService';

export type FriendshipStatus = 'not_friends' | 'request_sent' | 'request_received' | 'friends';

export const friendService = {
  async getFriendshipStatus(currentUserId: string, targetUserId: string): Promise<FriendshipStatus> {
    if (currentUserId === targetUserId) return 'friends';

    const friends = localStore.friendships[currentUserId] || [];
    if (friends.includes(targetUserId)) {
      return 'friends';
    }

    // Check sent request
    const sent = localStore.friendRequests.find(
      (r) => r.senderId === currentUserId && r.receiverId === targetUserId && r.status === 'pending'
    );
    if (sent) return 'request_sent';

    // Check received request
    const received = localStore.friendRequests.find(
      (r) => r.senderId === targetUserId && r.receiverId === currentUserId && r.status === 'pending'
    );
    if (received) return 'request_received';

    return 'not_friends';
  },

  async getFriends(userId: string): Promise<UserProfile[]> {
    const friendIds = localStore.friendships[userId] || [];
    return localStore.users.filter((u) => friendIds.includes(u.id));
  },

  async getUserFriends(userId: string): Promise<UserProfile[]> {
    return this.getFriends(userId);
  },

  async areFriends(currentUserId: string, targetUserId: string): Promise<boolean> {
    const status = await this.getFriendshipStatus(currentUserId, targetUserId);
    return status === 'friends';
  },

  async getMutualFriends(userId1: string, userId2: string): Promise<UserProfile[]> {
    const list1 = localStore.friendships[userId1] || [];
    const list2 = localStore.friendships[userId2] || [];
    const mutualIds = list1.filter((id) => list2.includes(id));
    return localStore.users.filter((u) => mutualIds.includes(u.id));
  },

  async getPendingRequests(userId: string): Promise<FriendRequest[]> {
    return localStore.friendRequests.filter(
      (r) => r.receiverId === userId && r.status === 'pending'
    );
  },

  async getSentRequests(userId: string): Promise<FriendRequest[]> {
    return localStore.friendRequests.filter(
      (r) => r.senderId === userId && r.status === 'pending'
    );
  },

  async sendFriendRequest(
    sender: { id: string; name: string; username: string; avatar: string },
    receiverId: string
  ): Promise<FriendRequest> {
    const receiver = localStore.users.find((u) => u.id === receiverId);
    if (!receiver) throw new Error('Target user not found');

    // Mutual friends count
    const mutuals = await this.getMutualFriends(sender.id, receiverId);

    const newRequest: FriendRequest = {
      id: `freq_${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      receiverId,
      receiverName: receiver.name,
      createdAt: new Date().toISOString(),
      status: 'pending',
      mutualFriendsCount: mutuals.length
    };

    localStore.friendRequests.push(newRequest);
    localStore.saveFriendRequests();

    // Send notification
    await notificationService.addNotification({
      userId: receiverId,
      senderId: sender.id,
      senderName: sender.name,
      senderUsername: sender.username,
      senderAvatar: sender.avatar,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${sender.name} sent you a friend request.`,
      targetId: sender.id,
      targetType: 'profile'
    });

    return newRequest;
  },

  async cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
    localStore.friendRequests = localStore.friendRequests.filter(
      (r) => !(r.senderId === senderId && r.receiverId === receiverId && r.status === 'pending')
    );
    localStore.saveFriendRequests();
  },

  async acceptFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    const request = localStore.friendRequests.find((r) => r.id === requestId);
    if (!request || request.receiverId !== currentUserId) {
      throw new Error('Friend request not found');
    }

    request.status = 'accepted';
    localStore.saveFriendRequests();

    // Add bidirectional friendship
    const u1 = request.senderId;
    const u2 = request.receiverId;

    if (!localStore.friendships[u1]) localStore.friendships[u1] = [];
    if (!localStore.friendships[u2]) localStore.friendships[u2] = [];

    if (!localStore.friendships[u1].includes(u2)) localStore.friendships[u1].push(u2);
    if (!localStore.friendships[u2].includes(u1)) localStore.friendships[u2].push(u1);
    localStore.saveFriendships();

    // Update friend counts on user profiles
    const user1 = localStore.users.find((u) => u.id === u1);
    const user2 = localStore.users.find((u) => u.id === u2);
    if (user1) user1.friendsCount = localStore.friendships[u1].length;
    if (user2) user2.friendsCount = localStore.friendships[u2].length;
    localStore.saveUsers();

    // Notify original sender
    if (user2) {
      await notificationService.addNotification({
        userId: u1,
        senderId: u2,
        senderName: user2.name,
        senderUsername: user2.username,
        senderAvatar: user2.avatar,
        type: 'friend_accept',
        title: 'Friend Request Accepted',
        message: `${user2.name} accepted your friend request.`,
        targetId: u2,
        targetType: 'profile'
      });
    }

    // Activity log
    await activityService.logActivity({
      userId: currentUserId,
      type: 'friend_added',
      title: 'Added a new friend',
      description: `You are now friends with ${request.senderName}`,
      targetId: u1
    });
  },

  async rejectFriendRequest(requestId: string, currentUserId: string): Promise<void> {
    const request = localStore.friendRequests.find((r) => r.id === requestId);
    if (!request || request.receiverId !== currentUserId) {
      throw new Error('Friend request not found');
    }

    request.status = 'rejected';
    localStore.saveFriendRequests();
  },

  async removeFriend(currentUserId: string, friendId: string): Promise<void> {
    if (localStore.friendships[currentUserId]) {
      localStore.friendships[currentUserId] = localStore.friendships[currentUserId].filter((id) => id !== friendId);
    }
    if (localStore.friendships[friendId]) {
      localStore.friendships[friendId] = localStore.friendships[friendId].filter((id) => id !== currentUserId);
    }
    localStore.saveFriendships();

    const u1 = localStore.users.find((u) => u.id === currentUserId);
    const u2 = localStore.users.find((u) => u.id === friendId);
    if (u1) u1.friendsCount = localStore.friendships[currentUserId]?.length || 0;
    if (u2) u2.friendsCount = localStore.friendships[friendId]?.length || 0;
    localStore.saveUsers();
  }
};
