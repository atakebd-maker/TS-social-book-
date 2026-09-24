import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Check, X, Search, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { friendService } from '../../services/friendService';
import { userService } from '../../services/userService';
import { UserProfile, FriendRequest } from '../../types';

export const FriendsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigateToProfile, showToast, refreshKey, triggerRefresh } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'suggestions'>('all');
  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    const myFriends = await friendService.getUserFriends(currentUser.id);
    setFriends(myFriends);

    const reqs = await friendService.getPendingRequests(currentUser.id);
    setPendingRequests(reqs);

    const suggestions = await userService.getSuggestedUsers(currentUser.id, 8);
    setSuggestedUsers(suggestions);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser, refreshKey]);

  const handleAccept = async (req: FriendRequest) => {
    if (!currentUser) return;
    try {
      await friendService.acceptFriendRequest(req.id, currentUser.id);
      showToast(`You and ${req.senderName} are now connected!`, 'success');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Could not accept request', 'error');
    }
  };

  const handleReject = async (req: FriendRequest) => {
    if (!currentUser) return;
    try {
      await friendService.rejectFriendRequest(req.id, currentUser.id);
      showToast('Friend request declined', 'info');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Could not decline request', 'error');
    }
  };

  const handleAddSuggested = async (user: UserProfile) => {
    if (!currentUser) return;
    try {
      await friendService.sendFriendRequest(
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        user.id
      );
      showToast(`Friend request sent to ${user.name}!`, 'success');
      triggerRefresh();
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      showToast(msg, 'error');
    }
  };

  const handleUnfriend = async (friendId: string, name: string) => {
    if (!currentUser) return;
    try {
      await friendService.removeFriend(currentUser.id, friendId);
      showToast(`Removed ${name} from friends list`, 'info');
      triggerRefresh();
      loadData();
    } catch {
      showToast('Failed to remove friend', 'error');
    }
  };

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Header & Navigation */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              <span>Friends & Community</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your connections, accept requests, and discover people.
            </p>
          </div>

          {/* Search friends input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pt-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>All Friends</span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px]">
              {friends.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[11px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'suggestions'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Suggestions</span>
            <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px]">
              {suggestedUsers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: All Friends */}
      {activeTab === 'all' && (
        <div>
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
                >
                  <div
                    onClick={() => navigateToProfile(friend.id)}
                    className="flex items-center gap-3 cursor-pointer mb-3"
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/50 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">
                        {friend.name}
                        {friend.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                      </div>
                      <div className="text-xs text-slate-400 truncate">@{friend.username}</div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {friend.work || friend.location}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigateToProfile(friend.id)}
                      className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 rounded-xl text-xs font-bold transition-colors text-center"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleUnfriend(friend.id, friend.name)}
                      className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                      title="Remove Friend"
                    >
                      Unfriend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery ? 'No friends match your search.' : 'You have not added any friends yet.'}
              </p>
              <button
                onClick={() => setActiveTab('suggestions')}
                className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                Browse Suggested People
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Requests */}
      {activeTab === 'requests' && (
        <div>
          {pendingRequests.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div
                    onClick={() => navigateToProfile(req.senderId)}
                    className="flex items-center gap-3 cursor-pointer mb-3 group"
                  >
                    <img
                      src={req.senderAvatar}
                      alt={req.senderName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {req.senderName}
                      </div>
                      <div className="text-xs text-slate-400">@{req.senderUsername}</div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                        {req.mutualFriendsCount ? `${req.mutualFriendsCount} mutual friends` : 'New member'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleAccept(req)}
                      className="py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      className="py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No pending friend requests.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                When someone sends you a friend request, it will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Suggestions */}
      {activeTab === 'suggestions' && (
        suggestedUsers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {suggestedUsers.map((user) => (
              <div
                key={user.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div
                  onClick={() => navigateToProfile(user.id)}
                  className="flex items-center gap-3 cursor-pointer mb-3"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      {user.name}
                      {user.isVerified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    <div className="text-xs text-slate-400 truncate">@{user.username}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {user.work || user.location || 'Member'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleAddSuggested(user)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Friend</span>
                  </button>
                  <button
                    onClick={() => navigateToProfile(user.id)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
                  >
                    Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No friend suggestions available right now.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Invite friends to create an account on TS Social Book!
            </p>
          </div>
        )
      )}
    </div>
  );
};
