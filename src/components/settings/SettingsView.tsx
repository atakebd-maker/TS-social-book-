import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Lock,
  Trash2,
  AlertTriangle,
  Check,
  User,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { settingsService } from '../../services/settingsService';
import { UserSettings } from '../../types';
import { Modal } from '../common/Modal';

export const SettingsView: React.FC = () => {
  const { currentUser, updateCurrentUser, logout } = useAuth();
  const { showToast } = useApp();

  const [activeSection, setActiveSection] = useState<'account' | 'privacy' | 'notifications' | 'security'>('account');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      settingsService.getUserSettings(currentUser.id).then(setSettings);
      setName(currentUser.name);
      setEmail(currentUser.email);
      setUsername(currentUser.username);
    }
  }, [currentUser]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setIsSaving(true);
      await updateCurrentUser({ name, email, username });
      showToast('Account details updated successfully!', 'success');
    } catch {
      showToast('Failed to update account', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSetting = async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    if (!currentUser || !settings) return;
    const updated = await settingsService.updateUserSettings(currentUser.id, {
      [key]: value
    });
    setSettings(updated);
    showToast('Preference updated', 'info');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match!', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    showToast('Password changed successfully!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      await settingsService.deleteAccount(currentUser.id);
      showToast('Your account has been deleted.', 'info');
      logout();
    } catch {
      showToast('Failed to delete account', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <span>Settings & Privacy</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize your experience, configure privacy, and manage security.
        </p>

        {/* Section Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'privacy', label: 'Privacy', icon: Eye },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'security', label: 'Security', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={`pb-3 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Settings */}
      {activeSection === 'account' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Account Credentials
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-rose-100 dark:border-rose-950/40">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Once you delete your account, there is no going back. All posts, stories, and connections will be permanently removed.
            </p>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete My Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      {activeSection === 'privacy' && settings && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
            Audience & Visibility
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Default Post Visibility
                </div>
                <div className="text-xs text-slate-500">
                  Who sees your new posts by default
                </div>
              </div>
              <select
                value={settings.defaultPostPrivacy}
                onChange={(e) => handleUpdateSetting('defaultPostPrivacy', e.target.value as any)}
                className="text-xs font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="public">🌐 Public</option>
                <option value="friends">👥 Friends</option>
                <option value="only_me">🔒 Only Me</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Who Can Send Friend Requests
                </div>
                <div className="text-xs text-slate-500">
                  Control who can invite you to be friends
                </div>
              </div>
              <select
                value={settings.whoCanSendFriendRequests}
                onChange={(e) => handleUpdateSetting('whoCanSendFriendRequests', e.target.value as any)}
                className="text-xs font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="everyone">Everyone</option>
                <option value="friends_of_friends">Friends of Friends</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Who Can Follow You
                </div>
                <div className="text-xs text-slate-500">
                  Allow members to follow your public posts
                </div>
              </div>
              <select
                value={settings.whoCanFollowMe}
                onChange={(e) => handleUpdateSetting('whoCanFollowMe', e.target.value as any)}
                className="text-xs font-semibold bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Profile Search Visibility
                </div>
                <div className="text-xs text-slate-500">
                  Let people find you via global search
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.searchEngineIndexing}
                  onChange={(e) => handleUpdateSetting('searchEngineIndexing', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Settings */}
      {activeSection === 'notifications' && settings && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
            Notification Alerts
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Select the activity you want to be alerted about.
          </p>

          {[
            { id: 'notifyReactions', label: 'Reactions & Likes', desc: 'When someone reacts to your post or comment' },
            { id: 'notifyComments', label: 'Comments & Replies', desc: 'When someone comments on your post or replies to you' },
            { id: 'notifyFriendRequests', label: 'Friend Requests', desc: 'When someone invites you or accepts your request' },
            { id: 'notifyFollows', label: 'New Followers', desc: 'When someone starts following your profile' },
            { id: 'notifyMentions', label: 'Tags & Mentions', desc: 'When someone mentions you in a post or comment' }
          ].map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl"
            >
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  {item.label}
                </div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={(settings as any)[item.id]}
                  onChange={(e) => handleUpdateSetting(item.id as any, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Security Settings */}
      {activeSection === 'security' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Change Password
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </form>

          {/* Active Sessions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
              Where You're Logged In
            </h3>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Chrome on Linux (Active Session)
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Currently Active • TS Social Book Web
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                Online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Confirm Account Deletion">
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            Are you sure you want to permanently delete your TS Social Book account? All your posts, photos, stories, and friendships will be irreversibly removed.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
            >
              Permanently Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
