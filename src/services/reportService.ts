/**
 * TS Social Book - Report Service
 * 
 * ============================================================================
 * FIREBASE INTEGRATION READY:
 * Reports are stored in `reports` collection:
 *   - addDoc(collection(db, "reports"), reportData)
 *   - query(collection(db, "reports"), where("status", "==", "pending"))
 * ============================================================================
 */

import { ContentReport, ReportCategory } from '../types';
import { localStore } from './localStore';

export const reportService = {
  async submitReport(input: {
    reporterId: string;
    reporterName: string;
    targetType: 'post' | 'comment' | 'profile' | 'story';
    targetId: string;
    targetAuthorName: string;
    targetSnippet?: string;
    category: ReportCategory;
    description?: string;
  }): Promise<ContentReport> {
    const newReport: ContentReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      reporterId: input.reporterId,
      reporterName: input.reporterName,
      targetType: input.targetType,
      targetId: input.targetId,
      targetAuthorName: input.targetAuthorName,
      targetSnippet: input.targetSnippet,
      category: input.category,
      description: input.description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    localStore.reports.unshift(newReport);
    localStore.saveReports();
    return newReport;
  },

  async getAllReports(): Promise<ContentReport[]> {
    return [...localStore.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async updateReportStatus(
    reportId: string,
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  ): Promise<void> {
    const report = localStore.reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Report not found');
    report.status = status;
    localStore.saveReports();
  },

  async deleteReportedContent(reportId: string): Promise<void> {
    const report = localStore.reports.find((r) => r.id === reportId);
    if (!report) throw new Error('Report not found');

    if (report.targetType === 'post') {
      localStore.posts = localStore.posts.filter((p) => p.id !== report.targetId);
      localStore.savePosts();
    } else if (report.targetType === 'story') {
      localStore.stories = localStore.stories.filter((s) => s.id !== report.targetId);
      localStore.saveStories();
    }

    report.status = 'resolved';
    localStore.saveReports();
  }
};
