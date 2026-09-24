import React, { useState } from 'react';
import { Heart, MoreHorizontal, CornerDownRight, Check, X, Flag, Trash2, Edit2 } from 'lucide-react';
import { PostComment, CommentReply } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { commentService } from '../../services/commentService';
import { CommentComposer } from './CommentComposer';

interface CommentItemProps {
  comment: PostComment;
  postId: string;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, postId }) => {
  const { currentUser } = useAuth();
  const { navigateToProfile, navigateToHashtag, openReportModal, showToast, triggerRefresh } = useApp();

  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isOwner = currentUser?.id === comment.authorId;
  const isAdmin = currentUser?.role === 'admin';
  const hasLiked = currentUser ? comment.likes?.includes(currentUser.id) : false;

  const handleToggleLike = async (replyId?: string) => {
    if (!currentUser) return;
    await commentService.toggleLikeComment(postId, comment.id, currentUser.id, replyId);
    triggerRefresh();
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await commentService.editComment(postId, comment.id, editContent.trim());
      setIsEditing(false);
      showToast('Comment updated', 'success');
      triggerRefresh();
    } catch {
      showToast('Failed to update comment', 'error');
    }
  };

  const handleDelete = async (replyId?: string) => {
    try {
      await commentService.deleteComment(postId, comment.id, replyId);
      showToast('Comment deleted', 'info');
      triggerRefresh();
    } catch {
      showToast('Failed to delete comment', 'error');
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(@\w+|#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            onClick={() => navigateToProfile(comment.authorId)}
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
    <div className="space-y-3">
      {/* Main Comment */}
      <div className="flex items-start gap-2.5 group">
        <img
          src={comment.authorAvatar}
          alt={comment.authorName}
          onClick={() => navigateToProfile(comment.authorId)}
          className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="relative inline-block max-w-full bg-slate-100 dark:bg-slate-800/80 rounded-2xl px-3.5 py-2">
            <div className="flex items-center justify-between gap-3 mb-0.5">
              <span
                onClick={() => navigateToProfile(comment.authorId)}
                className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
              >
                {comment.authorName}
              </span>

              {/* Options Menu */}
              <div className="relative">
                <button
                  onClick={() => setOptionsOpen((prev) => !prev)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity p-0.5"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>

                {optionsOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 w-32 z-20">
                    {isOwner && (
                      <button
                        onClick={() => {
                          setOptionsOpen(false);
                          setIsEditing(true);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}
                    {(isOwner || isAdmin) && (
                      <button
                        onClick={() => {
                          setOptionsOpen(false);
                          handleDelete();
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setOptionsOpen(false);
                        openReportModal({
                          type: 'comment',
                          id: comment.id,
                          authorName: comment.authorName,
                          snippet: comment.content
                        });
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Report</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Content or Edit Box */}
            {isEditing ? (
              <div className="mt-1 space-y-1.5">
                <input
                  type="text"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 bg-blue-600 text-white rounded text-[10px] flex items-center gap-1 font-bold"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-snug break-words">
                {renderFormattedText(comment.content)}
                {comment.isEdited && (
                  <span className="text-[10px] text-slate-400 ml-1">(edited)</span>
                )}
              </div>
            )}
          </div>

          {/* Sub-actions: Like, Reply, Like count */}
          <div className="flex items-center gap-3.5 mt-1 px-2 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              onClick={() => handleToggleLike()}
              className={`font-bold transition-colors ${
                hasLiked ? 'text-rose-600 dark:text-rose-400' : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Like
            </button>

            <button
              onClick={() => setIsReplying((prev) => !prev)}
              className="font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Reply
            </button>

            {comment.likes && comment.likes.length > 0 && (
              <span className="flex items-center gap-1 text-rose-500 font-semibold">
                <Heart className="w-3 h-3 fill-current" />
                <span>{comment.likes.length}</span>
              </span>
            )}
          </div>

          {/* Reply Composer */}
          {isReplying && (
            <div className="mt-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
              <CommentComposer
                postId={postId}
                parentCommentId={comment.id}
                replyToUsername={comment.authorUsername}
                autoFocus
                onSuccess={() => setIsReplying(false)}
                onCancel={() => setIsReplying(false)}
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2.5 space-y-2.5 pl-4 border-l-2 border-slate-200 dark:border-slate-800">
              {comment.replies.map((reply: CommentReply) => {
                const replyLiked = currentUser ? reply.likes?.includes(currentUser.id) : false;
                return (
                  <div key={reply.id} className="flex items-start gap-2 group/reply">
                    <img
                      src={reply.authorAvatar}
                      alt={reply.authorName}
                      onClick={() => navigateToProfile(reply.authorId)}
                      className="w-6 h-6 rounded-full object-cover shrink-0 cursor-pointer mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="inline-block bg-slate-100 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 max-w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            onClick={() => navigateToProfile(reply.authorId)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                          >
                            {reply.authorName}
                          </span>
                          {(currentUser?.id === reply.authorId || isAdmin) && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="opacity-0 group-hover/reply:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                          {renderFormattedText(reply.content)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-0.5 px-1.5 text-[10px] text-slate-500">
                        <button
                          onClick={() => handleToggleLike(reply.id)}
                          className={`font-bold ${
                            replyLiked ? 'text-rose-600' : 'hover:text-slate-900'
                          }`}
                        >
                          Like
                        </button>
                        {reply.likes && reply.likes.length > 0 && (
                          <span className="flex items-center gap-0.5 text-rose-500 font-semibold">
                            <Heart className="w-2.5 h-2.5 fill-current" />
                            <span>{reply.likes.length}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
