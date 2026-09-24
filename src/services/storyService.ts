/**
 * TS Social Book - Story Service
 * Powered by Cloud Firestore & local cache
 */

import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Story } from '../types';
import { localStore } from './localStore';

export const storyService = {
  async fetchRemoteStories(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'stories'));
      if (!snap.empty) {
        const remoteStories: Story[] = snap.docs.map((d) => d.data() as Story);
        const map = new Map<string, Story>();
        remoteStories.forEach((s) => map.set(s.id, s));
        localStore.stories.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        localStore.stories = Array.from(map.values());
        localStore.saveStories();
      }
    } catch (err) {
      console.warn('Failed to fetch stories from Firestore:', err);
    }
  },

  async getActiveStories(): Promise<Story[]> {
    this.fetchRemoteStories().catch(() => {});
    const now = Date.now();
    const active = localStore.stories.filter((s) => new Date(s.expiresAt).getTime() > now);
    return active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createStory(input: {
    authorId: string;
    authorName: string;
    authorUsername: string;
    authorAvatar: string;
    mediaUrl?: string;
    mediaType: 'image' | 'video' | 'text';
    textContent?: string;
    backgroundGradient?: string;
    durationHours?: number;
  }): Promise<Story> {
    const durationHours = input.durationHours || 24;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    const newStory: Story = {
      id: `story_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: input.authorId,
      authorName: input.authorName,
      authorUsername: input.authorUsername,
      authorAvatar: input.authorAvatar,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      textContent: input.textContent,
      backgroundGradient: input.backgroundGradient,
      createdAt,
      expiresAt,
      viewers: []
    };

    localStore.stories.unshift(newStory);
    localStore.saveStories();

    try {
      await setDoc(doc(db, 'stories', newStory.id), newStory);
    } catch (err) {
      console.warn('Failed to persist story to Firestore:', err);
    }

    return newStory;
  },

  async recordStoryView(
    storyId: string,
    viewer: { id: string; name: string; avatar: string }
  ): Promise<void> {
    const story = localStore.stories.find((s) => s.id === storyId);
    if (!story) return;

    if (!story.viewers) story.viewers = [];
    const alreadyViewed = story.viewers.some((v) => v.userId === viewer.id);
    if (!alreadyViewed && story.authorId !== viewer.id) {
      story.viewers.push({
        userId: viewer.id,
        userName: viewer.name,
        userAvatar: viewer.avatar,
        viewedAt: new Date().toISOString()
      });
      localStore.saveStories();

      try {
        await updateDoc(doc(db, 'stories', storyId), {
          viewers: story.viewers
        });
      } catch {
        // ignore background error
      }
    }
  },

  async deleteStory(storyId: string, currentUserId: string): Promise<void> {
    const story = localStore.stories.find((s) => s.id === storyId);
    if (!story) throw new Error('Story not found');
    if (story.authorId !== currentUserId) {
      const currentUser = localStore.users.find((u) => u.id === currentUserId);
      if (currentUser?.role !== 'admin') {
        throw new Error('Unauthorized to delete this story');
      }
    }

    localStore.stories = localStore.stories.filter((s) => s.id !== storyId);
    localStore.saveStories();

    try {
      await deleteDoc(doc(db, 'stories', storyId));
    } catch (err) {
      console.warn('Failed to delete story from Firestore:', err);
    }
  }
};
