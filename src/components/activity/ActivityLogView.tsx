import React, { useState, useEffect } from 'react';
import { Activity, Clock, Trash2, Heart, MessageCircle, FileText, UserPlus, Edit, Filter } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { activityService } from '../../services/activityService';
import { ActivityLog } from '../../types';

export const ActivityLogView: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast, refreshKey, triggerRefresh } = useApp();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await activityService.getActivityLogs(currentUser.id);
    setLogs(list);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [currentUser?.id]);

  const handleClearAll = async () => {
    if (!currentUser) return;
    await activityService.clearActivityLogs(currentUser.id);
    showToast('Activity log cleared', 'info');
    triggerRefresh();
    loadLogs();
  };

  const handleDeleteItem = async (id: string) => {
    await activityService.deleteActivityItem(id);
    showToast('Item removed from log', 'info');
    triggerRefresh();
    loadLogs();
  };

  const getActionIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'post_created':
      case 'post_shared':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'reaction_added':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'comment_added':
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      case 'friend_added':
        return <UserPlus className="w-4 h-4 text-amber-500" />;
      case 'followed_user':
        return <Edit className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span>Activity Log</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              A private history of your interactions, posts, and account events.
            </p>
          </div>

          {logs.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors"
            >
              Clear Log
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'create_post', label: 'Posts' },
            { id: 'reaction', label: 'Reactions' },
            { id: 'comment', label: 'Comments' },
            { id: 'friend_request', label: 'Friend Actions' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                filterType === pill.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Stream */}
      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading activity...</div>
      ) : filteredLogs.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getActionIcon(log.type)}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {log.description}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {new Date(log.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteItem(log.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                title="Remove item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No activity records found.
          </p>
        </div>
      )}
    </div>
  );
};
