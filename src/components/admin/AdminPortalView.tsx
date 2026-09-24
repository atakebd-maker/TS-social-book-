import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  FileText,
  MessageSquare,
  Heart,
  Flag,
  Sparkles,
  HardDrive,
  Check,
  X,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { adminService, AdminDashboardStats } from '../../services/adminService';
import { reportService } from '../../services/reportService';
import { UserProfile, Post, ContentReport, UserRole, UserStatus } from '../../types';

export const AdminPortalView: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast, refreshKey, triggerRefresh } = useApp();

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'posts' | 'reports'>('stats');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [s, u, p, r] = await Promise.all([
      adminService.getDashboardStats(),
      adminService.getAllUsers(),
      adminService.getAllPosts(),
      adminService.getAllReports()
    ]);
    setStats(s);
    setUsers(u);
    setPosts(p);
    setReports(r);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await adminService.updateUserRole(userId, role);
      showToast(`User role updated to ${role}`, 'success');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Failed to update role', 'error');
    }
  };

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    try {
      await adminService.updateUserStatus(userId, status);
      showToast(`User status set to ${status}`, 'info');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await adminService.deletePostAsAdmin(postId);
      showToast('Post removed by administrator', 'info');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Failed to delete post', 'error');
    }
  };

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'takedown') => {
    try {
      if (action === 'takedown') {
        await reportService.deleteReportedContent(reportId);
        showToast('Reported content removed and marked resolved', 'success');
      } else if (action === 'resolve') {
        await reportService.updateReportStatus(reportId, 'resolved');
        showToast('Report marked resolved', 'info');
      } else {
        await reportService.updateReportStatus(reportId, 'dismissed');
        showToast('Report dismissed', 'info');
      }
      triggerRefresh();
      loadData();
    } catch {
      showToast('Error handling report', 'error');
    }
  };

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-6 border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Management Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Platform Moderation & Controls
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-xl">
              Inspect application statistics, moderate community reports, manage user roles, and enforce platform standards.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-indigo-900/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'stats', label: 'Dashboard Overview' },
            { id: 'reports', label: `Moderation Queue (${reports.filter((r) => r.status === 'pending').length})` },
            { id: 'users', label: `User Accounts (${users.length})` },
            { id: 'posts', label: `Published Posts (${posts.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white/10 text-indigo-200 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: DASHBOARD STATS */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 w-fit mb-3">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalUsers}
              </div>
              <div className="text-xs text-slate-500 font-medium">Total Registered Members</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold">
                {stats.activeUsers} Active now
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 w-fit mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalPosts}
              </div>
              <div className="text-xs text-slate-500 font-medium">Total Posts Published</div>
              <div className="text-[11px] text-indigo-600 mt-1 font-semibold">Feed Stream Active</div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 w-fit mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.totalReactions}
              </div>
              <div className="text-xs text-slate-500 font-medium">Reactions Expressed</div>
              <div className="text-[11px] text-rose-600 mt-1 font-semibold">
                {stats.totalComments} Comments
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 w-fit mb-3">
                <Flag className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.pendingReports}
              </div>
              <div className="text-xs text-slate-500 font-medium">Pending Moderation Reports</div>
              <div className="text-[11px] text-amber-600 mt-1 font-semibold">
                {stats.totalReports} Total Reports
              </div>
            </div>
          </div>

          {/* Infrastructure & Architecture Status */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Platform Service Architecture</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              TS Social Book is configured with a modular service layer (`authService`, `userService`, `postService`, `reactionService`, `storyService`, `friendService`, `reportService`). All service functions return Promises matching Firebase SDK methods for turnkey migration.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">Persistence Engine</div>
                <div className="text-slate-500">Active Reactive Store (Local & Session Ready)</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">Firebase Hooks</div>
                <div className="text-slate-500">Pre-wired in `src/services/firebase-config.ts`</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-0.5">Messenger Status</div>
                <div className="text-slate-500 font-semibold text-emerald-600">Strictly Excluded (As Requested)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPORTS QUEUE */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Community Moderation Reports
            </h2>
            <span className="text-xs text-slate-500">
              {reports.filter((r) => r.status === 'pending').length} pending review
            </span>
          </div>

          {reports.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {reports.map((report) => (
                <div key={report.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          {report.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Reported {report.targetType} by {report.targetAuthorName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Reported by {report.reporterName} • {new Date(report.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        report.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : report.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.targetSnippet && (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-slate-300">
                      "{report.targetSnippet}"
                    </div>
                  )}

                  {report.description && (
                    <p className="text-xs text-slate-500">
                      <strong>Reporter Note:</strong> {report.description}
                    </p>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleReportAction(report.id, 'takedown')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Content</span>
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'resolve')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => handleReportAction(report.id, 'dismiss')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No reports found in queue.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              User Accounts Directory
            </h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />
            </div>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              {user.name}
                              {user.isVerified && <span className="text-blue-500">✓</span>}
                            </div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-semibold"
                        >
                          <option value="user">User</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="py-3">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.id, e.target.value as UserStatus)}
                          className={`px-2 py-1 rounded-lg font-semibold ${
                            user.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>

                      <td className="py-3 text-slate-400">
                        {new Date(user.joinedDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleStatusChange(user.id, user.status === 'banned' ? 'active' : 'banned')}
                          className={`px-2.5 py-1 rounded-lg font-bold ${
                            user.status === 'banned'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {user.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No registered user accounts found.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: POSTS MODERATION */}
      {activeTab === 'posts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
            Published Content Moderation ({posts.length})
          </h2>

          {posts.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {posts.map((post) => (
                <div key={post.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <img src={post.authorAvatar} alt={post.authorName} className="w-6 h-6 rounded-full" />
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{post.authorName}</span>
                      <span className="text-[11px] text-slate-400">• {new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                      {post.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              No posts published to moderate.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
