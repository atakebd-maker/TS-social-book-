import React, { useState } from 'react';
import { Send, Smile } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { commentService } from '../../services/commentService';

interface CommentComposerProps {
  postId: string;
  parentCommentId?: string; // If replying to a comment
  replyToUsername?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export const CommentComposer: React.FC<CommentComposerProps> = ({
  postId,
  parentCommentId,
  replyToUsername,
  onSuccess,
  onCancel,
  autoFocus = false
}) => {
  const { currentUser, openAuthModal } = useAuth();
  const { showToast, triggerRefresh } = useApp();
  const [content, setContent] = useState(replyToUsername ? `@${replyToUsername} ` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      if (parentCommentId) {
        await commentService.addReply(
          postId,
          parentCommentId,
          {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar
          },
          content.trim()
        );
        showToast('Reply added', 'success');
      } else {
        await commentService.addComment(
          postId,
          {
            id: currentUser.id,
            name: currentUser.name,
            username: currentUser.username,
            avatar: currentUser.avatar
          },
          content.trim()
        );
        showToast('Comment posted', 'success');
      }

      setContent('');
      triggerRefresh();
      onSuccess?.();
    } catch {
      showToast('Failed to post comment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-xs text-slate-500">
        <button
          onClick={() => openAuthModal('login')}
          className="text-blue-600 font-bold hover:underline"
        >
          Sign in
        </button>{' '}
        to join the discussion and comment.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2.5 w-full">
      <img
        src={currentUser.avatar}
        alt={currentUser.name}
        className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
      />
      <div className="flex-1 relative flex items-center">
        <input
          type="text"
          autoFocus={autoFocus}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={parentCommentId ? `Reply to @${replyToUsername}...` : 'Write a comment... (use @name, #tags)'}
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 pl-3.5 pr-18 py-2 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all border border-transparent focus:bg-white dark:focus:bg-slate-900"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-600 px-1.5 py-0.5"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
            aria-label="Send comment"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </form>
  );
};
