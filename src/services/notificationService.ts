/**
 * TS Social Book - Notification Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Stored in `notifications` collection:
 *   - query(collection(db, "notifications"), where("userId", "==", currentUserId))
 *   - updateDoc(doc(db, "notifications", notifId), { isRead: true })
 * ============================================================================
 */

import { AppNotification } from '../types';
import { localStore } from './localStore';

export const notificationService = {
  async getNotifications(userId: string): Promise<AppNotification[]> {
    return localStore.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUnreadCount(userId: string): Promise<number> {
    return localStore.notifications.filter((n) => n.userId === userId && !n.isRead).length;
  },

  async addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    localStore.notifications.unshift(newNotif);
    localStore.saveNotifications();
    return newNotif;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const notif = localStore.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      localStore.saveNotifications();
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    localStore.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    localStore.saveNotifications();
  },

  async deleteNotification(notificationId: string): Promise<void> {
    localStore.notifications = localStore.notifications.filter((n) => n.id !== notificationId);
    localStore.saveNotifications();
  }
};
