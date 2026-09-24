import React, { useState } from 'react';
import { Share2, Copy, Check, Send } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';

export const ShareModal: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { postToShare, closeShareModal, showToast, triggerRefresh } = useApp();
  const [quoteText, setQuoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!postToShare) return null;

  const handleShareToFeed = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.sharePost(
        postToShare.id,
        {
          id: currentUser.id,
          name: currentUser.name,
          username: currentUser.username,
          avatar: currentUser.avatar
        },
        quoteText.trim() || undefined
      );

      showToast('Post shared to your feed!', 'success');
      triggerRefresh();
      closeShareModal();
      setQuoteText('');
    } catch {
      showToast('Could not share post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#post_${postToShare.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    showToast('Post link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${postToShare.authorName} on TS Social Book`,
          text: postToShare.content,
          url: `${window.location.origin}/#post_${postToShare.id}`
        });
      } catch {
        // User cancelled or unsupported
      }
    }
  };

  return (
    <Modal isOpen={Boolean(postToShare)} onClose={closeShareModal} title="Share Post" maxWidth="md">
      <div className="space-y-4">
        {/* Quote Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Add your thoughts (Optional)
          </label>
          <textarea
            rows={2}
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="What do you think about this post?"
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* Post Preview Snippet */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-1.5">
            <img
              src={postToShare.authorAvatar}
              alt={postToShare.authorName}
              className="w-7 h-7 rounded-full object-cover"
            />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {postToShare.authorName}
              </div>
              <div className="text-[10px] text-slate-400">@{postToShare.authorUsername}</div>
            </div>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3">
            {postToShare.content}
          </p>
        </div>

        {/* Share Options List */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            disabled={isSubmitting}
            onClick={handleShareToFeed}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Sharing...' : 'Share to My Feed Now'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2 px-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share via device apps</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
