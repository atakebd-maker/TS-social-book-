/**
 * TS Social Book - Comment Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Comments can be stored in a root `comments` collection or as a subcollection:
 *   - collection(db, "posts", postId, "comments")
 *   - addDoc(...)
 *   - onSnapshot(...) for real-time updates
 * ============================================================================
 */

import { PostComment, CommentReply } from '../types';
import { localStore } from './localStore';
import { notificationService } from './notificationService';
import { activityService } from './activityService';

export const commentService = {
  async getComments(postId: string): Promise<PostComment[]> {
    const list = localStore.comments[postId] || [];
    return [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async addComment(
    postId: string,
    author: { id: string; name: string; username: string; avatar: string },
    content: string
  ): Promise<PostComment> {
    if (!content.trim()) throw new Error('Comment cannot be empty');

    const newComment: PostComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatar: author.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: [],
      replies: []
    };

    if (!localStore.comments[postId]) {
      localStore.comments[postId] = [];
    }

    localStore.comments[postId].push(newComment);
    localStore.saveComments();

    // Increment post comment count
    const post = localStore.posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      localStore.savePosts();

      // Notify post author
      if (post.authorId !== author.id) {
        await notificationService.addNotification({
          userId: post.authorId,
          senderId: author.id,
          senderName: author.name,
          senderUsername: author.username,
          senderAvatar: author.avatar,
          type: 'comment',
          title: 'Commented on your post',
          message: `${author.name}: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
          targetId: postId,
          targetType: 'post'
        });
      }
    }

    // Activity log
    await activityService.logActivity({
      userId: author.id,
      type: 'comment_added',
      title: 'Added a comment',
      description: `Commented: "${content.slice(0, 40)}"`,
      targetId: postId
    });

    return newComment;
  },

  async addReply(
    postId: string,
    commentId: string,
    author: { id: string; name: string; username: string; avatar: string },
    content: string
  ): Promise<CommentReply> {
    const commentsList = localStore.comments[postId] || [];
    const parentComment = commentsList.find((c) => c.id === commentId);
    if (!parentComment) throw new Error('Parent comment not found');

    const reply: CommentReply = {
      id: `reply_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      commentId,
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatar: author.avatar,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      likes: []
    };

    if (!parentComment.replies) parentComment.replies = [];
    parentComment.replies.push(reply);
    localStore.saveComments();

    // Also increment post total comment count
    const post = localStore.posts.find((p) => p.id === postId);
    if (post) {
      post.commentsCount = (post.commentsCount || 0) + 1;
      localStore.savePosts();
    }

    // Notify original comment author
    if (parentComment.authorId !== author.id) {
      await notificationService.addNotification({
        userId: parentComment.authorId,
        senderId: author.id,
        senderName: author.name,
        senderUsername: author.username,
        senderAvatar: author.avatar,
        type: 'comment_reply',
        title: 'Replied to your comment',
        message: `${author.name} replied: "${content.slice(0, 50)}"`,
        targetId: postId,
        targetType: 'comment'
      });
    }

    return reply;
  },

  async toggleLikeComment(
    postId: string,
    commentId: string,
    userId: string,
    replyId?: string
  ): Promise<boolean> {
    const commentsList = localStore.comments[postId] || [];
    const comment = commentsList.find((c) => c.id === commentId);
    if (!comment) return false;

    if (replyId) {
      const reply = comment.replies?.find((r) => r.id === replyId);
      if (!reply) return false;
      if (!reply.likes) reply.likes = [];
      const hasLiked = reply.likes.includes(userId);
      if (hasLiked) {
        reply.likes = reply.likes.filter((id) => id !== userId);
      } else {
        reply.likes.push(userId);
      }
      localStore.saveComments();
      return !hasLiked;
    } else {
      if (!comment.likes) comment.likes = [];
      const hasLiked = comment.likes.includes(userId);
      if (hasLiked) {
        comment.likes = comment.likes.filter((id) => id !== userId);
      } else {
        comment.likes.push(userId);
      }
      localStore.saveComments();
      return !hasLiked;
    }
  },

  async editComment(
    postId: string,
    commentId: string,
    newContent: string,
    replyId?: string
  ): Promise<void> {
    const commentsList = localStore.comments[postId] || [];
    const comment = commentsList.find((c) => c.id === commentId);
    if (!comment) throw new Error('Comment not found');

    if (replyId) {
      const reply = comment.replies?.find((r) => r.id === replyId);
      if (!reply) throw new Error('Reply not found');
      reply.content = newContent;
      reply.isEdited = true;
    } else {
      comment.content = newContent;
      comment.isEdited = true;
    }
    localStore.saveComments();
  },

  async deleteComment(postId: string, commentId: string, replyId?: string): Promise<void> {
    const commentsList = localStore.comments[postId] || [];
    if (replyId) {
      const comment = commentsList.find((c) => c.id === commentId);
      if (comment && comment.replies) {
        comment.replies = comment.replies.filter((r) => r.id !== replyId);
        localStore.saveComments();

        const post = localStore.posts.find((p) => p.id === postId);
        if (post && post.commentsCount > 0) {
          post.commentsCount -= 1;
          localStore.savePosts();
        }
      }
    } else {
      const comment = commentsList.find((c) => c.id === commentId);
      const repliesCount = comment?.replies?.length || 0;
      localStore.comments[postId] = commentsList.filter((c) => c.id !== commentId);
      localStore.saveComments();

      const post = localStore.posts.find((p) => p.id === postId);
      if (post && post.commentsCount > 0) {
        post.commentsCount = Math.max(0, post.commentsCount - (1 + repliesCount));
        localStore.savePosts();
      }
    }
  }
};
