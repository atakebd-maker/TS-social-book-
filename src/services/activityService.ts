/**
 * TS Social Book - Activity Log Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Activity logs are stored in `activityLogs` collection:
 *   - query(collection(db, "activityLogs"), where("userId", "==", userId), orderBy("createdAt", "desc"))
 * ============================================================================
 */

import { ActivityLog } from '../types';
import { localStore } from './localStore';

export const activityService = {
  async getActivityLogs(userId: string): Promise<ActivityLog[]> {
    return localStore.activityLogs
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async logActivity(item: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<ActivityLog> {
    const newLog: ActivityLog = {
      ...item,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };

    localStore.activityLogs.unshift(newLog);
    // Keep max 100 activity items in local store
    if (localStore.activityLogs.length > 100) {
      localStore.activityLogs = localStore.activityLogs.slice(0, 100);
    }
    localStore.saveActivityLogs();
    return newLog;
  },

  async clearActivityLogs(userId: string): Promise<void> {
    localStore.activityLogs = localStore.activityLogs.filter((a) => a.userId !== userId);
    localStore.saveActivityLogs();
  },

  async deleteActivityItem(activityId: string): Promise<void> {
    localStore.activityLogs = localStore.activityLogs.filter((a) => a.id !== activityId);
    localStore.saveActivityLogs();
  }
};
