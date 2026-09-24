/**
 * TS Social Book - Reaction Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Reactions can be stored as a subcollection or inside post document fields:
 *   - runTransaction to atomically increment/decrement counters
 *   - setDoc(doc(db, "posts", postId, "reactions", userId), { type, createdAt })
 * ============================================================================
 */

import { ReactionType } from '../types';
import { localStore } from './localStore';
import { notificationService } from './notificationService';
import { activityService } from './activityService';

export const REACTION_ICONS: Record<
  ReactionType,
  { label: string; emoji: string; color: string; bgColor: string }
> = {
  like: { label: 'Like', emoji: '👍', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/40' },
  love: { label: 'Love', emoji: '❤️', color: 'text-rose-600', bgColor: 'bg-rose-50 dark:bg-rose-950/40' },
  care: { label: 'Care', emoji: '🥰', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
  haha: { label: 'Haha', emoji: '😂', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
  wow: { label: 'Wow', emoji: '😮', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
  sad: { label: 'Sad', emoji: '😢', color: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/40' },
  angry: { label: 'Angry', emoji: '😡', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-950/40' }
};

export const reactionService = {
  /**
   * Set or update a user's reaction to a post
   */
  async setPostReaction(
    postId: string,
    user: { id: string; name: string; username: string; avatar: string },
    reaction: ReactionType
  ): Promise<{ userReaction: ReactionType | null; counts: Record<ReactionType, number> }> {
    const post = localStore.posts.find((p) => p.id === postId);
    if (!post) throw new Error('Post not found');

    if (!post.reactions) post.reactions = {};
    if (!post.reactionsCount) {
      post.reactionsCount = { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
    }

    const previousReaction = post.reactions[user.id];

    // If same reaction tapped, toggle it off
    if (previousReaction === reaction) {
      delete post.reactions[user.id];
      if (post.reactionsCount[reaction] > 0) {
        post.reactionsCount[reaction] -= 1;
      }
      localStore.savePosts();
      return { userReaction: null, counts: post.reactionsCount };
    }

    // If changing reaction from a previous one
    if (previousReaction) {
      if (post.reactionsCount[previousReaction] > 0) {
        post.reactionsCount[previousReaction] -= 1;
      }
    }

    // Set new reaction
    post.reactions[user.id] = reaction;
    post.reactionsCount[reaction] = (post.reactionsCount[reaction] || 0) + 1;
    localStore.savePosts();

    // Notify author if reacting to someone else's post
    if (post.authorId !== user.id) {
      await notificationService.addNotification({
        userId: post.authorId,
        senderId: user.id,
        senderName: user.name,
        senderUsername: user.username,
        senderAvatar: user.avatar,
        type: reaction === 'love' ? 'love' : 'like',
        title: `Reacted ${REACTION_ICONS[reaction].emoji} to your post`,
        message: `${user.name} reacted ${REACTION_ICONS[reaction].label} to your post`,
        targetId: post.id,
        targetType: 'post'
      });
    }

    // Activity log
    await activityService.logActivity({
      userId: user.id,
      type: 'reaction_added',
      title: `Reacted ${REACTION_ICONS[reaction].emoji} ${REACTION_ICONS[reaction].label}`,
      description: `Reacted to post by ${post.authorName}`,
      targetId: post.id
    });

    return { userReaction: reaction, counts: post.reactionsCount };
  },

  /**
   * Remove a reaction completely
   */
  async removePostReaction(
    postId: string,
    userId: string
  ): Promise<Record<ReactionType, number>> {
    const post = localStore.posts.find((p) => p.id === postId);
    if (!post || !post.reactions) return { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 };

    const previous = post.reactions[userId];
    if (previous) {
      delete post.reactions[userId];
      if (post.reactionsCount[previous] > 0) {
        post.reactionsCount[previous] -= 1;
      }
      localStore.savePosts();
    }

    return post.reactionsCount;
  }
};
