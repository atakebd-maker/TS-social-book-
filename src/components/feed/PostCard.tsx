import React, { useState, useEffect } from 'react';
import {
  MoreHorizontal,
  Bookmark,
  Share2,
  MessageCircle,
  Globe,
  Users,
  Lock,
  MapPin,
  Smile,
  Copy,
  Trash2,
  Edit2,
  Flag,
  EyeOff,
  Check,
  Play,
  Repeat
} from 'lucide-react';
import { Post, ReactionType, PostMedia } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { reactionService, REACTION_ICONS } from '../../services/reactionService';
import { postService } from '../../services/postService';
import { commentService } from '../../services/commentService';
import { ReactionPopover } from './ReactionPopover';
import { CommentItem } from '../comments/CommentItem';
import { CommentComposer } from '../comments/CommentComposer';

interface PostCardProps {
  post: Post;
  onHide?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onHide }) => {
  const { currentUser, openAuthModal } = useAuth();
  const {
    navigateToProfile,
    navigateToHashtag,
    openShareModal,
    openEditPostModal,
    openReportModal,
    openMediaLightbox,
    showToast,
    triggerRefresh,
    refreshKey
  } = useApp();

  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<import('../../types').PostComment[]>([]);
  const [showReactionPopover, setShowReactionPopover] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Check saved state
  useEffect(() => {
    if (currentUser) {
      postService.isPostSaved(currentUser.id, post.id).then(setIsSaved);
    }
  }, [currentUser, post.id, refreshKey]);

  // Load comments when drawer is opened or refreshed
  useEffect(() => {
    if (commentsOpen) {
      commentService.getComments(post.id).then(setComments);
    }
  }, [commentsOpen, post.id, refreshKey]);

  const userReaction: ReactionType | undefined = currentUser
    ? post.reactions?.[currentUser.id]
    : undefined;

  const totalReactions = Object.values(post.reactionsCount || {}).reduce((acc, v) => acc + v, 0);

  // Identify top reaction types present on this post
  const activeReactionEntries = Object.entries(post.reactionsCount || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]) as [ReactionType, number][];

  const handleSelectReaction = async (reaction: ReactionType) => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setShowReactionPopover(false);
    await reactionService.setPostReaction(
      post.id,
      {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      reaction
    );
    triggerRefresh();
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    // If user already reacted, toggle off, otherwise default to 'like'
    const newReaction: ReactionType = userReaction ? userReaction : 'like';
    await reactionService.setPostReaction(
      post.id,
      {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      newReaction
    );
    triggerRefresh();
  };

  const handleToggleSave = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (isSaved) {
      await postService.unsavePost(currentUser.id, post.id);
      setIsSaved(false);
      showToast('Post removed from saved items', 'info');
    } else {
      await postService.savePost(currentUser.id, post.id);
      setIsSaved(true);
      showToast('Post saved to your bookmarks!', 'success');
    }
    triggerRefresh();
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#post_${post.id}`;
    navigator.clipboard?.writeText(url);
    showToast('Link copied to clipboard!', 'success');
    setOptionsOpen(false);
  };

  const handleDeletePost = async () => {
    try {
      await postService.deletePost(post.id);
      showToast('Post deleted', 'info');
      setOptionsOpen(false);
      triggerRefresh();
    } catch {
      showToast('Could not delete post', 'error');
    }
  };

  const isAuthor = currentUser?.id === post.authorId;
  const isAdmin = currentUser?.role === 'admin';

  // Format timestamps nicely
  const getRelativeTime = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Render text with clickable #hashtags and @mentions
  const renderRichText = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            onClick={() => navigateToProfile(post.authorId)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('#')) {
        return (
          <span
            key={index}
            onClick={() => navigateToHashtag(part)}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs mb-4 overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Post Card Header */}
      <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={post.authorAvatar}
            alt={post.authorName}
            onClick={() => navigateToProfile(post.authorId)}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 cursor-pointer hover:ring-blue-500 transition-all shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={() => navigateToProfile(post.authorId)}
                className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 cursor-pointer transition-colors truncate"
              >
                {post.authorName}
              </span>

              {post.authorVerified && (
                <span className="text-blue-500 text-xs font-bold" title="Verified Member">
                  ✓
                </span>
              )}

              {post.feeling && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  is {post.feeling.emoji} {post.feeling.text}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex-wrap">
              <span>@{post.authorUsername}</span>
              <span>•</span>
              <span title={new Date(post.createdAt).toLocaleString()}>
                {getRelativeTime(post.createdAt)}
              </span>
              {post.isEdited && <span>(edited)</span>}
              <span>•</span>

              {/* Privacy Icon */}
              {post.privacy === 'public' && (
                <span title="Public">
                  <Globe className="w-3 h-3 text-slate-400" />
                </span>
              )}
              {post.privacy === 'friends' && (
                <span title="Friends Only">
                  <Users className="w-3 h-3 text-slate-400" />
                </span>
              )}
              {post.privacy === 'only_me' && (
                <span title="Only Me">
                  <Lock className="w-3 h-3 text-slate-400" />
                </span>
              )}

              {post.location && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post Options Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setOptionsOpen((prev) => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Post Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {optionsOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 w-44 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleToggleSave}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                <span>{isSaved ? 'Remove from Saved' : 'Save Post'}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Post Link</span>
              </button>

              {onHide && (
                <button
                  onClick={() => {
                    setOptionsOpen(false);
                    onHide();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Hide Post</span>
                </button>
              )}

              {isAuthor && (
                <button
                  onClick={() => {
                    setOptionsOpen(false);
                    openEditPostModal(post);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Post</span>
                </button>
              )}

              {(isAuthor || isAdmin) && (
                <button
                  onClick={handleDeletePost}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}

              <button
                onClick={() => {
                  setOptionsOpen(false);
                  openReportModal({
                    type: 'post',
                    id: post.id,
                    authorName: post.authorName,
                    snippet: post.content
                  });
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5"
              >
                <Flag className="w-3.5 h-3.5 text-amber-500" />
                <span>Report Post</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {post.backgroundGradient ? (
        <div
          className="p-8 sm:p-12 text-center text-white text-lg sm:text-xl font-bold leading-relaxed flex items-center justify-center min-h-48"
          style={{ background: post.backgroundGradient }}
        >
          <span>{post.content}</span>
        </div>
      ) : (
        <div className="px-4 sm:px-5 pb-3 text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed break-words">
          {renderRichText(post.content)}
        </div>
      )}

      {/* Media Attachments Gallery */}
      {post.media && post.media.length > 0 && (
        <div className="mt-1">
          {post.media.length === 1 ? (
            <div
              onClick={() => openMediaLightbox(post.media![0])}
              className="relative max-h-[520px] overflow-hidden bg-slate-900 cursor-pointer group"
            >
              {post.media[0].type === 'image' ? (
                <img
                  src={post.media[0].url}
                  alt={post.media[0].caption || 'Post image'}
                  className="w-full h-full object-cover group-hover:scale-101 transition-transform duration-300"
                />
              ) : (
                <div className="relative">
                  <video
                    src={post.media[0].url}
                    controls
                    className="w-full max-h-[520px] object-contain bg-black"
                  />
                </div>
              )}
            </div>
          ) : post.media.length === 2 ? (
            <div className="grid grid-cols-2 gap-1 max-h-[380px] overflow-hidden">
              {post.media.map((m) => (
                <div
                  key={m.id}
                  onClick={() => openMediaLightbox(m)}
                  className="h-72 overflow-hidden bg-slate-900 cursor-pointer group"
                >
                  <img
                    src={m.url}
                    alt="Media"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 max-h-[340px] overflow-hidden">
              {post.media.slice(0, 3).map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => openMediaLightbox(m)}
                  className="relative h-64 overflow-hidden bg-slate-900 cursor-pointer group"
                >
                  <img
                    src={m.url}
                    alt="Media"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {idx === 2 && post.media!.length > 3 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-extrabold text-xl">
                      +{post.media!.length - 3}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared Post Quote Embed */}
      {post.sharedPost && (
        <div className="mx-4 sm:mx-5 my-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="w-3.5 h-3.5 text-blue-500" />
            <img
              src={post.sharedPost.originalAuthorAvatar}
              alt={post.sharedPost.originalAuthorName}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span
              onClick={() => navigateToProfile(post.sharedPost!.originalAuthorId)}
              className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:underline cursor-pointer"
            >
              {post.sharedPost.originalAuthorName}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              • {getRelativeTime(post.sharedPost.originalCreatedAt)}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">
            {post.sharedPost.originalContent}
          </p>

          {post.sharedPost.originalMedia && post.sharedPost.originalMedia.length > 0 && (
            <img
              src={post.sharedPost.originalMedia[0].url}
              alt="Shared Media"
              onClick={() => openMediaLightbox(post.sharedPost!.originalMedia![0])}
              className="rounded-xl max-h-56 w-full object-cover cursor-pointer"
            />
          )}
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
        {/* Left: Reaction Icons breakdown */}
        <div className="flex items-center gap-1.5 min-w-0">
          {totalReactions > 0 ? (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                {activeReactionEntries.slice(0, 3).map(([type]) => (
                  <span
                    key={type}
                    className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs ring-2 ring-white dark:ring-slate-900"
                    title={REACTION_ICONS[type].label}
                  >
                    {REACTION_ICONS[type].emoji}
                  </span>
                ))}
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300 ml-1">
                {totalReactions}
              </span>
            </div>
          ) : (
            <span>Be the first to react</span>
          )}
        </div>

        {/* Right: Comments, Shares, Saves Count */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCommentsOpen((prev) => !prev)}
            className="hover:underline cursor-pointer"
          >
            {post.commentsCount || 0} Comments
          </button>
          <span>•</span>
          <button onClick={() => openShareModal(post)} className="hover:underline cursor-pointer">
            {post.sharesCount || 0} Shares
          </button>
        </div>
      </div>

      {/* Action Buttons Row (Like with Popover, Comment, Share, Save) */}
      <div className="px-2 py-1 flex items-center justify-between gap-1 relative">
        {/* Like / Reaction Button */}
        <div
          className="relative flex-1"
          onMouseEnter={() => setShowReactionPopover(true)}
        >
          <button
            onClick={handleToggleLike}
            className={`w-full py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              userReaction
                ? `${REACTION_ICONS[userReaction].color} ${REACTION_ICONS[userReaction].bgColor}`
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {userReaction ? (
              <>
                <span className="text-base">{REACTION_ICONS[userReaction].emoji}</span>
                <span>{REACTION_ICONS[userReaction].label}</span>
              </>
            ) : (
              <>
                <span className="text-base">👍</span>
                <span>Like</span>
              </>
            )}
          </button>

          {/* Reaction Popover */}
          {showReactionPopover && (
            <ReactionPopover
              onSelectReaction={handleSelectReaction}
              onClose={() => setShowReactionPopover(false)}
            />
          )}
        </div>

        {/* Comment Button */}
        <button
          onClick={() => setCommentsOpen((prev) => !prev)}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
            commentsOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        {/* Share Button */}
        <button
          onClick={() => openShareModal(post)}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        {/* Save Bookmark Button */}
        <button
          onClick={handleToggleSave}
          className={`p-2 rounded-xl text-xs font-bold transition-colors ${
            isSaved
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title={isSaved ? 'Saved to bookmarks' : 'Bookmark post'}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {commentsOpen && (
        <div className="p-4 sm:p-5 pt-3 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 space-y-4 animate-in fade-in duration-150">
          {/* New Comment Composer */}
          <CommentComposer postId={post.id} />

          {/* Comments List */}
          <div className="space-y-3.5 pt-1">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} postId={post.id} />
              ))
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                No comments yet. Start the conversation!
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
