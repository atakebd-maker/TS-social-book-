import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Globe,
  Calendar,
  UserPlus,
  UserCheck,
  UserX,
  Edit3,
  Flag,
  ShieldAlert,
  Image as ImageIcon,
  Grid,
  FileText,
  Users,
  Camera,
  MoreVertical,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { userService } from '../../services/userService';
import { friendService } from '../../services/friendService';
import { followService } from '../../services/followService';
import { postService } from '../../services/postService';
import { UserProfile, Post, FriendRequest } from '../../types';
import { PostCard } from '../feed/PostCard';
import { CreatePostCard } from '../feed/CreatePostCard';
import { EditProfileModal } from './EditProfileModal';
import { storageService } from '../../services/storageService';

export const ProfileView: React.FC = () => {
  const { currentUser, openAuthModal, updateCurrentUser } = useAuth();
  const {
    selectedProfileUserId,
    navigateToProfile,
    navigateToFeed,
    openReportModal,
    openMediaLightbox,
    showToast,
    refreshKey,
    triggerRefresh
  } = useApp();

  const targetUserId = selectedProfileUserId || currentUser?.id || '';

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'posts' | 'about' | 'friends' | 'photos'>('posts');
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userFriends, setUserFriends] = useState<UserProfile[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<
    'none' | 'friends' | 'pending_sent' | 'pending_received' | 'blocked'
  >('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isSelf = currentUser?.id === targetUserId;

  const loadProfile = async () => {
    if (!targetUserId) {
      setProfileUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const user = await userService.getUserById(targetUserId);
    setProfileUser(user);

    if (user) {
      const posts = await postService.getUserPosts(user.id);
      setUserPosts(posts);

      const friends = await friendService.getUserFriends(user.id);
      setUserFriends(friends);

      if (currentUser && !isSelf) {
        const isFr = await friendService.areFriends(currentUser.id, user.id);
        const reqs = await friendService.getPendingRequests(currentUser.id);
        const received = reqs.find((r) => r.senderId === user.id);

        if (isFr) {
          setFriendshipStatus('friends');
        } else if (received) {
          setFriendshipStatus('pending_received');
        } else {
          // Check if we sent them a request
          const targetReqs = await friendService.getPendingRequests(user.id);
          const sent = targetReqs.find((r) => r.senderId === currentUser.id);
          setFriendshipStatus(sent ? 'pending_sent' : 'none');
        }

        const following = await followService.isFollowing(currentUser.id, user.id);
        setIsFollowing(following);

        const isBlk = await userService.isBlocked(currentUser.id, user.id);
        if (isBlk) setFriendshipStatus('blocked');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
  }, [targetUserId, currentUser, refreshKey]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-16 animate-pulse">
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="h-48 sm:h-64 bg-slate-200" />
          <div className="px-6 pb-6 pt-16 space-y-3">
            <div className="w-48 h-6 bg-slate-200 rounded" />
            <div className="w-32 h-4 bg-slate-200 rounded" />
            <div className="w-full max-w-md h-4 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-10 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Profile Not Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            The profile you are looking for does not exist or may have been deleted.
          </p>
          <button
            onClick={navigateToFeed}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Back to Home Feed
          </button>
        </div>
      </div>
    );
  }

  // Handle Cover / Avatar update
  const handleQuickCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      const res = await storageService.uploadMedia(file);
      await updateCurrentUser({ coverPhoto: res.url });
      showToast('Cover photo updated!', 'success');
      triggerRefresh();
    } catch {
      showToast('Upload failed', 'error');
    }
  };

  const handleQuickAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    try {
      const res = await storageService.uploadMedia(file);
      await updateCurrentUser({ avatar: res.url });
      showToast('Avatar updated!', 'success');
      triggerRefresh();
    } catch {
      showToast('Upload failed', 'error');
    }
  };

  // Actions
  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    try {
      await friendService.sendFriendRequest(
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        profileUser.id
      );
      setFriendshipStatus('pending_sent');
      showToast('Friend request sent!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending request';
      showToast(msg, 'error');
    }
  };

  const handleCancelFriendRequest = async () => {
    if (!currentUser) return;
    await friendService.cancelFriendRequest(currentUser.id, profileUser.id);
    setFriendshipStatus('none');
    showToast('Friend request cancelled', 'info');
  };

  const handleUnfriend = async () => {
    if (!currentUser) return;
    await friendService.removeFriend(currentUser.id, profileUser.id);
    setFriendshipStatus('none');
    showToast(`Removed ${profileUser.name} from friends`, 'info');
    triggerRefresh();
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    const next = await followService.toggleFollow(currentUser.id, profileUser.id);
    setIsFollowing(next);
    showToast(next ? `Now following ${profileUser.name}` : `Unfollowed ${profileUser.name}`, 'info');
    triggerRefresh();
  };

  const handleToggleBlock = async () => {
    if (!currentUser) return;
    const isBlk = await userService.isBlocked(currentUser.id, profileUser.id);
    if (isBlk) {
      await userService.unblockUser(currentUser.id, profileUser.id);
      setFriendshipStatus('none');
      showToast(`Unblocked ${profileUser.name}`, 'info');
    } else {
      await userService.blockUser(currentUser.id, profileUser.id);
      setFriendshipStatus('blocked');
      showToast(`Blocked ${profileUser.name}`, 'info');
    }
    setOptionsOpen(false);
  };

  // Extract all media posted by user for Photos tab
  const allUserMedia = userPosts.flatMap((p) => p.media || []);

  return (
    <div className="max-w-4xl mx-auto pb-16">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs mb-6">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-72 w-full bg-slate-200 dark:bg-slate-800">
          <img
            src={profileUser.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />

          {isSelf && (
            <label className="absolute bottom-4 right-4 px-3.5 py-2 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold backdrop-blur-md cursor-pointer flex items-center gap-2 transition-all shadow-md">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Edit Cover Photo</span>
              <input type="file" accept="image/*" onChange={handleQuickCoverChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            {/* Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-full h-full object-cover"
                />
                {isSelf && (
                  <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white cursor-pointer transition-colors opacity-0 hover:opacity-100">
                    <Camera className="w-6 h-6" />
                    <input type="file" accept="image/*" onChange={handleQuickAvatarChange} className="hidden" />
                  </label>
                )}
              </div>

              <div className="mb-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <span>{profileUser.name}</span>
                  {profileUser.isVerified && (
                    <span className="text-blue-500 text-sm font-bold" title="Verified Member">✓</span>
                  )}
                  {profileUser.role === 'admin' && (
                    <span className="text-[10px] bg-blue-600 text-white font-extrabold uppercase px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">@{profileUser.username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1">
                  <span><strong className="text-slate-900 dark:text-white">{profileUser.friendsCount || 0}</strong> friends</span>
                  <span>•</span>
                  <span><strong className="text-slate-900 dark:text-white">{profileUser.followersCount || 0}</strong> followers</span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {isSelf ? (
                <button
                  onClick={() => setEditModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {/* Friend Button */}
                  {friendshipStatus === 'none' && (
                    <button
                      onClick={handleSendFriendRequest}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Friend</span>
                    </button>
                  )}

                  {friendshipStatus === 'pending_sent' && (
                    <button
                      onClick={handleCancelFriendRequest}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Cancel Request</span>
                    </button>
                  )}

                  {friendshipStatus === 'friends' && (
                    <button
                      onClick={handleUnfriend}
                      className="px-4 py-2 bg-emerald-50 hover:bg-rose-50 text-emerald-700 hover:text-rose-600 dark:bg-emerald-950/40 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </button>
                  )}

                  {/* Follow Button */}
                  <button
                    onClick={handleToggleFollow}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    }`}
                  >
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>

                  {/* Options Menu (Block / Report) */}
                  <div className="relative">
                    <button
                      onClick={() => setOptionsOpen((prev) => !prev)}
                      className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {optionsOpen && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 w-44 z-30">
                        <button
                          onClick={handleToggleBlock}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>{friendshipStatus === 'blocked' ? 'Unblock User' : 'Block User'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setOptionsOpen(false);
                            openReportModal({
                              type: 'profile',
                              id: profileUser.id,
                              authorName: profileUser.name,
                              snippet: profileUser.bio
                            });
                          }}
                          className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Flag className="w-3.5 h-3.5 text-amber-500" />
                          <span>Report Profile</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Bio */}
          {profileUser.bio && (
            <p className="text-sm text-slate-700 dark:text-slate-300 max-w-2xl mb-4 leading-relaxed">
              {profileUser.bio}
            </p>
          )}

          {/* Quick Info Badges */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
            {profileUser.work && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{profileUser.work}</span>
              </span>
            )}
            {profileUser.education && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>{profileUser.education}</span>
              </span>
            )}
            {profileUser.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Lives in {profileUser.location}</span>
              </span>
            )}
            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{profileUser.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined {new Date(profileUser.joinedDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
            </span>
          </div>
        </div>

        {/* Profile Tabs Navigation */}
        <div className="flex items-center border-t border-slate-200/80 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'posts', label: 'Timeline Posts', icon: FileText, count: userPosts.length },
            { id: 'about', label: 'About Details', icon: UserCheck, count: null },
            { id: 'friends', label: 'Friends', icon: Users, count: userFriends.length },
            { id: 'photos', label: 'Photos & Videos', icon: ImageIcon, count: allUserMedia.length }
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`py-3.5 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="text-[11px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 rounded-full font-semibold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Posts (Timeline) */}
      {activeSubTab === 'posts' && (
        <div className="max-w-2xl mx-auto space-y-4">
          {isSelf && <CreatePostCard />}

          {userPosts.length > 0 ? (
            userPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isSelf ? "You haven't posted anything yet." : `${profileUser.name} hasn't posted anything yet.`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: About Details */}
      {activeSubTab === 'about' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs max-w-2xl mx-auto space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
              Overview & Bio
            </h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {profileUser.bio || 'No bio provided yet.'}
            </p>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
              Work & Education
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Works at</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {profileUser.work || 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <GraduationCap className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Studied at</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {profileUser.education || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
              Basic Info & Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Current City</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {profileUser.location || 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Website</div>
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {profileUser.website || 'Not specified'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Friends */}
      {activeSubTab === 'friends' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Friends ({userFriends.length})
            </h3>
          </div>

          {userFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userFriends.map((f) => (
                <div
                  key={f.id}
                  onClick={() => navigateToProfile(f.id)}
                  className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-slate-800/60 cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                      {f.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">@{f.username}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">{f.work || f.location}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              No friends to display yet.
            </p>
          )}
        </div>
      )}

      {/* Tab 4: Photos & Media Gallery */}
      {activeSubTab === 'photos' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs max-w-3xl mx-auto">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Uploaded Photos & Media ({allUserMedia.length})
          </h3>

          {allUserMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {allUserMedia.map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => openMediaLightbox(m)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer group relative"
                >
                  {m.type === 'image' ? (
                    <img
                      src={m.url}
                      alt="Media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black">
                      <video src={m.url} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-6">
              No media uploads found on this profile yet.
            </p>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      {isSelf && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          user={profileUser}
        />
      )}
    </div>
  );
};
