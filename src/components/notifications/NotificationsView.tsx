import React, { useState, useEffect } from 'react';
import {
  Bell,
  Heart,
  MessageCircle,
  Repeat,
  UserPlus,
  UserCheck,
  CheckCheck,
  Trash2,
  ExternalLink,
  AtSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { notificationService } from '../../services/notificationService';
import { AppNotification } from '../../types';

export const NotificationsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigateToProfile, navigateToFeed, showToast, refreshKey, triggerRefresh } = useApp();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await notificationService.getNotifications(currentUser.id);
    setNotifications(list);
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser?.id]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await notificationService.markAllAsRead(currentUser.id);
    showToast('All notifications marked as read', 'info');
    triggerRefresh();
    loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await notificationService.markAsRead(id);
    triggerRefresh();
    loadNotifications();
  };

  const handleDelete = async (id: string) => {
    await notificationService.deleteNotification(id);
    showToast('Notification removed', 'info');
    triggerRefresh();
    loadNotifications();
  };

  const handleClickItem = (n: AppNotification) => {
    handleMarkRead(n.id);
    if (n.targetId && n.targetType === 'post') {
      navigateToFeed();
    } else if (n.senderId) {
      navigateToProfile(n.senderId);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'like':
      case 'love':
        return <Heart className="w-4 h-4 text-rose-500 fill-current" />;
      case 'comment':
      case 'comment_reply':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'share':
        return <Repeat className="w-4 h-4 text-emerald-500" />;
      case 'follow':
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'friend_request':
        return <UserPlus className="w-4 h-4 text-amber-500" />;
      case 'friend_accept':
        return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.isRead : true));

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <span>Notifications</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates on reactions, comments, friends, and activity.
            </p>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Filter Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2">
          <button
            onClick={() => setFilter('all')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              filter === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px]">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setFilter('unread')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Unread</span>
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[11px] font-bold">
                {notifications.filter((n) => !n.isRead).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {filtered.length > 0 ? (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleClickItem(item)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 group relative ${
                item.isRead
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 hover:border-blue-300'
              }`}
            >
              {/* Sender Avatar with Type Badge */}
              <div className="relative shrink-0">
                <img
                  src={item.senderAvatar}
                  alt={item.senderName}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs ring-1 ring-slate-200 dark:ring-slate-700">
                  {getNotificationIcon(item.type)}
                </div>
              </div>

              {/* Notification Message Content */}
              <div className="flex-1 min-w-0 pr-8">
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug">
                  <strong className="text-slate-900 dark:text-white font-bold">{item.senderName}</strong>{' '}
                  {item.message}
                </p>

                <div className="text-[11px] text-slate-400 mt-1">
                  {new Date(item.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              {/* Unread indicator dot */}
              {!item.isRead && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-600" />
              )}

              {/* Delete action button on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id);
                }}
                className="opacity-0 group-hover:opacity-100 absolute bottom-3 right-3 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                title="Remove notification"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            We will notify you when friends react to your posts or interact with you.
          </p>
        </div>
      )}
    </div>
  );
};
