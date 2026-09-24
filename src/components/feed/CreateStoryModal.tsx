import React, { useState } from 'react';
import { Upload, Type, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { storyService } from '../../services/storyService';
import { storageService } from '../../services/storageService';

const GRADIENTS = [
  { id: 'sapphire', name: 'Sapphire Blue', style: 'linear-gradient(135deg, #1d4ed8 0%, #0284c7 100%)' },
  { id: 'sunset', name: 'Golden Sunset', style: 'linear-gradient(135deg, #ea580c 0%, #db2777 100%)' },
  { id: 'emerald', name: 'Emerald Forest', style: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' },
  { id: 'violet', name: 'Neon Violet', style: 'linear-gradient(135deg, #7c3aed 0%, #c026d3 100%)' },
  { id: 'midnight', name: 'Midnight', style: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }
];

export const CreateStoryModal: React.FC = () => {
  const { currentUser } = useAuth();
  const { createStoryModalOpen, closeCreateStoryModal, showToast, triggerRefresh } = useApp();

  const [storyType, setStoryType] = useState<'media' | 'text'>('media');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENTS[0].style);
  const [textContent, setTextContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await storageService.uploadMedia(file);
      setMediaPreview({ url: res.url, type: res.type });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!currentUser) return;

    if (storyType === 'text' && !textContent.trim()) {
      showToast('Please type something for your story!', 'error');
      return;
    }

    if (storyType === 'media' && !mediaPreview) {
      showToast('Please select a photo or video for your story!', 'error');
      return;
    }

    try {
      setIsUploading(true);
      await storyService.createStory({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatar,
        mediaType: storyType === 'media' ? mediaPreview!.type : 'text',
        mediaUrl: storyType === 'media' ? mediaPreview?.url : undefined,
        textContent: textContent.trim() || undefined,
        backgroundGradient: storyType === 'text' ? selectedGradient : undefined,
        durationHours: 24
      });

      showToast('Story published! Active for 24 hours.', 'success');
      triggerRefresh();
      closeCreateStoryModal();
      // Reset form
      setTextContent('');
      setMediaPreview(null);
    } catch {
      showToast('Failed to publish story', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={createStoryModalOpen}
      onClose={closeCreateStoryModal}
      title="Create a Story"
      maxWidth="md"
    >
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-4">
        <button
          onClick={() => setStoryType('media')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            storyType === 'media'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Photo or Video</span>
        </button>
        <button
          onClick={() => setStoryType('text')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            storyType === 'text'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Text Story</span>
        </button>
      </div>

      {/* Media Mode */}
      {storyType === 'media' && (
        <div className="space-y-4">
          {mediaPreview ? (
            <div className="relative h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {mediaPreview.type === 'image' ? (
                <img src={mediaPreview.url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={mediaPreview.url} controls className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => setMediaPreview(null)}
                className="absolute top-3 right-3 px-3 py-1 bg-black/60 hover:bg-black/80 text-white text-xs font-bold rounded-full backdrop-blur-xs transition-colors"
              >
                Change Media
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl h-52 flex flex-col items-center justify-center cursor-pointer p-6 text-center hover:bg-blue-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <Upload className="w-8 h-8 text-blue-500 mb-2" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Click or drag photo / video
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP, GIF, MP4, WebM (up to 50MB)
              </p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Add Caption (Optional)
            </label>
            <input
              type="text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="What's happening in this story?"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Text Mode */}
      {storyType === 'text' && (
        <div className="space-y-4">
          {/* Live Preview Canvas */}
          <div
            className="h-56 rounded-2xl p-6 flex items-center justify-center text-center text-white text-lg font-bold shadow-inner"
            style={{ background: selectedGradient }}
          >
            {textContent.trim() ? (
              <span className="line-clamp-4 leading-relaxed">{textContent}</span>
            ) : (
              <span className="opacity-50 font-normal">Start typing your message below...</span>
            )}
          </div>

          <div>
            <textarea
              rows={3}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Type your story message..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
            />
          </div>

          {/* Gradient Palette */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Background Style
            </label>
            <div className="flex items-center gap-2">
              {GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGradient(g.style)}
                  style={{ background: g.style }}
                  className={`w-9 h-9 rounded-full ring-offset-2 dark:ring-offset-slate-900 flex items-center justify-center transition-all ${
                    selectedGradient === g.style ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                  }`}
                  title={g.name}
                >
                  {selectedGradient === g.style && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          Stories disappear after 24 hours.
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={closeCreateStoryModal}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isUploading}
            onClick={handlePublish}
            className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isUploading ? 'Publishing...' : 'Share to Story'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
