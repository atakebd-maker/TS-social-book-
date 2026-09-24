import React, { useState, useEffect } from 'react';
import { Globe, Users, Lock, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';
import { PostPrivacy } from '../../types';

export const EditPostModal: React.FC = () => {
  const { postToEdit, closeEditPostModal, showToast, triggerRefresh } = useApp();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (postToEdit) {
      setContent(postToEdit.content);
      setPrivacy(postToEdit.privacy);
    }
  }, [postToEdit]);

  if (!postToEdit) return null;

  const handleSave = async () => {
    if (!content.trim()) {
      showToast('Post content cannot be empty', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.updatePost(postToEdit.id, {
        content: content.trim(),
        privacy
      });

      showToast('Post updated successfully', 'success');
      triggerRefresh();
      closeEditPostModal();
    } catch {
      showToast('Failed to update post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(postToEdit)} onClose={closeEditPostModal} title="Edit Post" maxWidth="md">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Content
            </label>
            {/* Privacy toggle */}
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
              className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="public">🌐 Public</option>
              <option value="friends">👥 Friends</option>
              <option value="only_me">🔒 Only Me</option>
            </select>
          </div>

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={closeEditPostModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
