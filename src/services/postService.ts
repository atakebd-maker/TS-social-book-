/**
 * TS Social Book - Post Service
 * Powered by Cloud Firestore with instant local caching
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit
} from 'firebase/firestore';
import { db } from './firebase';
import { Post, PostPrivacy, PostMedia } from '../types';
import { localStore } from './localStore';
import { activityService } from './activityService';

export interface CreatePostInput {
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorVerified?: boolean;
  content: string;
  privacy?: PostPrivacy;
  media?: PostMedia[];
  feeling?: { emoji: string; text: string };
  location?: string;
  taggedUsers?: { id: string; name: string; username: string }[];
  backgroundGradient?: string;
}

export const postService = {
  async fetchRemotePosts(): Promise<void> {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), fsLimit(50));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const fetched: Post[] = snap.docs.map((d) => d.data() as Post);
        const map = new Map<string, Post>();
        fetched.forEach((p) => map.set(p.id, p));
        localStore.posts.forEach((p) => {
          if (!map.has(p.id)) map.set(p.id, p);
        });
        localStore.posts = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        localStore.savePosts();
      }
    } catch (err) {
      console.warn('Failed to fetch posts from Firestore:', err);
    }
  },

  async getPosts(options: {
    filter?: 'all' | 'friends' | 'trending' | 'media';
    currentUserId?: string;
    authorId?: string;
    hashtag?: string;
  } = {}): Promise<Post[]> {
    // Attempt remote sync in background
    this.fetchRemotePosts().catch(() => {});

    let list = [...localStore.posts];

    // Filter out posts from blocked users
    if (options.currentUserId) {
      const blocked = localStore.blockedUsers[options.currentUserId] || [];
      list = list.filter((p) => !blocked.includes(p.authorId));
    }

    // Author specific filter
    if (options.authorId) {
      list = list.filter((p) => p.authorId === options.authorId);
    }

    // Hashtag filter
    if (options.hashtag) {
      const tag = options.hashtag.replace(/^#/, '').toLowerCase();
      list = list.filter((p) => p.content.toLowerCase().includes(`#${tag}`));
    }

    // Category / Feed filters
    if (options.filter === 'friends' && options.currentUserId) {
      const friends = localStore.friendships[options.currentUserId] || [];
      list = list.filter((p) => friends.includes(p.authorId) || p.authorId === options.currentUserId);
    } else if (options.filter === 'trending') {
      list = list.sort((a, b) => {
        const totalA =
          Object.values(a.reactionsCount).reduce((acc, v) => acc + v, 0) +
          a.commentsCount * 2 +
          a.sharesCount * 3;
        const totalB =
          Object.values(b.reactionsCount).reduce((acc, v) => acc + v, 0) +
          b.commentsCount * 2 +
          b.sharesCount * 3;
        return totalB - totalA;
      });
      return list;
    } else if (options.filter === 'media') {
      list = list.filter((p) => p.media && p.media.length > 0);
    }

    // Default chronological sort
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getPostById(postId: string): Promise<Post | null> {
    const cached = localStore.posts.find((p) => p.id === postId);
    if (cached) return cached;

    try {
      const snap = await getDoc(doc(db, 'posts', postId));
      if (snap.exists()) {
        const post = snap.data() as Post;
        localStore.posts.unshift(post);
        localStore.savePosts();
        return post;
      }
    } catch (err) {
      console.warn('Failed to load post by id from Firestore:', err);
    }

    return null;
  },

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.getPosts({ authorId: userId });
  },

  async getFeedPosts(currentUserId?: string, _limit = 50): Promise<Post[]> {
    return this.getPosts({ currentUserId });
  },

  async getPostsByHashtag(hashtag: string): Promise<Post[]> {
    return this.getPosts({ hashtag });
  },

  async createPost(input: CreatePostInput): Promise<Post> {
    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      authorId: input.authorId,
      authorName: input.authorName,
      authorUsername: input.authorUsername,
      authorAvatar: input.authorAvatar,
      authorVerified: input.authorVerified,
      createdAt: new Date().toISOString(),
      content: input.content,
      privacy: input.privacy || 'public',
      media: input.media || [],
      feeling: input.feeling,
      location: input.location,
      taggedUsers: input.taggedUsers,
      backgroundGradient: input.backgroundGradient,
      reactions: {},
      reactionsCount: {
        like: 0,
        love: 0,
        care: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0
      },
      commentsCount: 0,
      sharesCount: 0,
      savesCount: 0
    };

    // 1. Immediately store in local store for rapid UI response
    localStore.posts.unshift(newPost);
    localStore.savePosts();

    // 2. Persist permanently to Cloud Firestore
    try {
      await setDoc(doc(db, 'posts', newPost.id), newPost);
    } catch (err) {
      console.error('Failed to persist post to Firestore:', err);
    }

    // 3. Increment author's post count
    const author = localStore.users.find((u) => u.id === input.authorId);
    if (author) {
      author.postsCount = (author.postsCount || 0) + 1;
      localStore.saveUsers();
      try {
        await updateDoc(doc(db, 'users', author.id), {
          postsCount: author.postsCount
        });
      } catch {
        // ignore background sync error
      }
    }

    // 4. Log Activity
    await activityService.logActivity({
      userId: input.authorId,
      type: 'post_created',
      title: 'Created a post',
      description: input.content.slice(0, 60) + (input.content.length > 60 ? '...' : ''),
      targetId: newPost.id
    });

    return newPost;
  },

  async updatePost(postId: string, updates: Partial<Post>): Promise<Post> {
    const index = localStore.posts.findIndex((p) => p.id === postId);
    if (index === -1) throw new Error('Post not found');

    const updated: Post = {
      ...localStore.posts[index],
      ...updates,
      isEdited: true,
      updatedAt: new Date().toISOString()
    };

    localStore.posts[index] = updated;
    localStore.savePosts();

    try {
      await updateDoc(doc(db, 'posts', postId), updates);
    } catch (err) {
      console.warn('Failed to update post in Firestore:', err);
    }

    return updated;
  },

  async deletePost(postId: string): Promise<void> {
    localStore.posts = localStore.posts.filter((p) => p.id !== postId);
    localStore.savePosts();

    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (err) {
      console.warn('Failed to delete post from Firestore:', err);
    }
  },

  async reactToPost(
    postId: string,
    userId: string,
    reactionType: 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry'
  ): Promise<Post> {
    const index = localStore.posts.findIndex((p) => p.id === postId);
    if (index === -1) throw new Error('Post not found');

    const post = { ...localStore.posts[index] };
    const currentReaction = post.reactions[userId];

    if (currentReaction === reactionType) {
      delete post.reactions[userId];
      post.reactionsCount[reactionType] = Math.max(0, post.reactionsCount[reactionType] - 1);
    } else {
      if (currentReaction) {
        post.reactionsCount[currentReaction] = Math.max(0, post.reactionsCount[currentReaction] - 1);
      }
      post.reactions[userId] = reactionType;
      post.reactionsCount[reactionType] = (post.reactionsCount[reactionType] || 0) + 1;
    }

    localStore.posts[index] = post;
    localStore.savePosts();

    try {
      await updateDoc(doc(db, 'posts', postId), {
        reactions: post.reactions,
        reactionsCount: post.reactionsCount
      });
    } catch {
      // background
    }

    return post;
  },

  async sharePost(
    postId: string,
    user: string | { id: string; name: string; username: string; avatar?: string; isVerified?: boolean },
    sharedCaption?: string
  ): Promise<Post> {
    const originalPost = await this.getPostById(postId);
    if (!originalPost) throw new Error('Original post not found');

    const author =
      typeof user === 'string'
        ? localStore.users.find((u) => u.id === user) || {
            id: user,
            name: 'User',
            username: 'user',
            avatar: '',
            isVerified: false
          }
        : user;

    const sharePost = await this.createPost({
      authorId: author.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatar: author.avatar || '',
      authorVerified: author.isVerified,
      content: sharedCaption
        ? `${sharedCaption}\n\nShared post from @${originalPost.authorUsername}`
        : `Shared a post from @${originalPost.authorUsername}`,
      privacy: 'public'
    });

    originalPost.sharesCount = (originalPost.sharesCount || 0) + 1;
    localStore.savePosts();

    try {
      await updateDoc(doc(db, 'posts', postId), {
        sharesCount: originalPost.sharesCount
      });
    } catch {
      // background
    }

    return sharePost;
  },

  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const saved = localStore.savedPosts[userId] || [];
    return saved.includes(postId);
  },

  async savePost(userId: string, postId: string): Promise<void> {
    if (!localStore.savedPosts[userId]) {
      localStore.savedPosts[userId] = [];
    }
    if (!localStore.savedPosts[userId].includes(postId)) {
      localStore.savedPosts[userId].push(postId);
      localStore.saveSavedPosts();

      const post = localStore.posts.find((p) => p.id === postId);
      if (post) {
        post.savesCount = (post.savesCount || 0) + 1;
        localStore.savePosts();
        try {
          await updateDoc(doc(db, 'posts', postId), {
            savesCount: post.savesCount
          });
        } catch {
          // background
        }
      }
    }
  },

  async unsavePost(userId: string, postId: string): Promise<void> {
    if (localStore.savedPosts[userId]) {
      localStore.savedPosts[userId] = localStore.savedPosts[userId].filter((id) => id !== postId);
      localStore.saveSavedPosts();

      const post = localStore.posts.find((p) => p.id === postId);
      if (post) {
        post.savesCount = Math.max(0, (post.savesCount || 1) - 1);
        localStore.savePosts();
        try {
          await updateDoc(doc(db, 'posts', postId), {
            savesCount: post.savesCount
          });
        } catch {
          // background
        }
      }
    }
  },

  async getSavedPosts(userId: string): Promise<Post[]> {
    const savedIds = localStore.savedPosts[userId] || [];
    return localStore.posts.filter((p) => savedIds.includes(p.id));
  },

  async searchPosts(queryStr: string): Promise<Post[]> {
    const clean = queryStr.trim().toLowerCase();
    if (!clean) return [];
    return localStore.posts.filter(
      (p) =>
        p.content.toLowerCase().includes(clean) ||
        p.authorName.toLowerCase().includes(clean) ||
        p.authorUsername.toLowerCase().includes(clean)
    );
  }
};
