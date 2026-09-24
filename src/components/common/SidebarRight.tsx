import React, { useState, useEffect } from 'react';
import { UserPlus, Check, X, ArrowRight, ShieldCheck, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { friendService } from '../../services/friendService';
import { userService } from '../../services/userService';
import { FriendRequest, UserProfile } from '../../types';

export const SidebarRight: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigateToProfile, navigateToHashtag, showToast, refreshKey } = useApp();

  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const loadData = async () => {
    if (!currentUser) return;
    const reqs = await friendService.getPendingRequests(currentUser.id);
    setPendingRequests(reqs);

    const suggested = await userService.getSuggestedUsers(currentUser.id, 4);
    setSuggestedUsers(suggested);
  };

  useEffect(() => {
    loadData();
  }, [currentUser, refreshKey]);

  const handleAcceptRequest = async (request: FriendRequest) => {
    if (!currentUser) return;
    setLoadingAction(request.id);
    try {
      await friendService.acceptFriendRequest(request.id, currentUser.id);
      showToast(`You are now friends with ${request.senderName}!`, 'success');
      loadData();
    } catch {
      showToast('Could not accept friend request', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectRequest = async (request: FriendRequest) => {
    if (!currentUser) return;
    setLoadingAction(request.id);
    try {
      await friendService.rejectFriendRequest(request.id, currentUser.id);
      showToast('Friend request declined', 'info');
      loadData();
    } catch {
      showToast('Could not decline request', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddFriend = async (targetUser: UserProfile) => {
    if (!currentUser) return;
    setLoadingAction(`add_${targetUser.id}`);
    try {
      await friendService.sendFriendRequest(
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        targetUser.id
      );
      showToast(`Friend request sent to ${targetUser.name}!`, 'success');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send request';
      showToast(msg, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  if (!currentUser) return null;

  return (
    <aside className="hidden xl:block w-72 shrink-0 space-y-5 sticky top-20 self-start max-h-[calc(100vh-5.5rem)] overflow-y-auto no-scrollbar">
      {/* Pending Friend Requests Widget */}
      {pendingRequests.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 p-4 shadow-sm bg-gradient-to-b from-blue-50/40 to-transparent dark:from-blue-950/20">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <span>Friend Requests</span>
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            </h4>
          </div>

          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
                <div
                  onClick={() => navigateToProfile(req.senderId)}
                  className="flex items-center gap-2.5 cursor-pointer mb-2.5 group"
                >
                  <img
                    src={req.senderAvatar}
                    alt={req.senderName}
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                      {req.senderName}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      {req.mutualFriendsCount ? `${req.mutualFriendsCount} mutual friends` : `@${req.senderUsername}`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={loadingAction === req.id}
                    onClick={() => handleAcceptRequest(req)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-xs transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm</span>
                  </button>
                  <button
                    disabled={loadingAction === req.id}
                    onClick={() => handleRejectRequest(req)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Friends Widget */}
      {suggestedUsers.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Suggested For You
            </h4>
          </div>

          <div className="space-y-3">
            {suggestedUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2.5">
                <div
                  onClick={() => navigateToProfile(user.id)}
                  className="flex items-center gap-2.5 cursor-pointer min-w-0 group flex-1"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors flex items-center gap-1">
                      {user.name}
                      {user.isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
                    </div>
                    <div className="text-[11px] text-slate-600 truncate">
                      {user.work || `@${user.username}`}
                    </div>
                  </div>
                </div>

                <button
                  disabled={loadingAction === `add_${user.id}`}
                  onClick={() => handleAddFriend(user)}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-lg flex items-center gap-1 shrink-0 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Suggested People
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            No recommendations right now. As new members sign up, suggestions will show up here.
          </p>
        </div>
      )}

      {/* Community Spotlight Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-4 text-white shadow-md shadow-blue-600/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Flame className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-blue-100">
            TS Social Community
          </span>
        </div>
        <p className="text-xs text-blue-100/90 leading-relaxed mb-3">
          Share high quality ideas, showcase your creative work, and connect across borders without private messaging distractions.
        </p>
        <button
          onClick={() => navigateToHashtag('#TSsocialbook')}
          className="text-xs font-bold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
        >
          <span>Explore #TSsocialbook</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Security & Verification Guarantee */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>Role-based moderation, privacy controls, and content reporting active.</span>
      </div>
    </aside>
  );
};
