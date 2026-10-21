import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  Globe,
  Users,
  Lock,
  X,
  Palette,
  Send,
  Sparkles,
  Video,
  Layers
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';
import { storageService } from '../../services/storageService';
import { PostPrivacy, PostMedia } from '../../types';

const FEELINGS = [
  { emoji: '😊', text: 'happy' },
  { emoji: '🚀', text: 'energized' },
  { emoji: '✨', text: 'blessed' },
  { emoji: '☕', text: 'drinking coffee' },
  { emoji: '💻', text: 'coding' },
  { emoji: '🎉', text: 'celebrating' },
  { emoji: '✈️', text: 'traveling' },
  { emoji: '🎧', text: 'listening to music' },
  { emoji: '🎮', text: 'gaming' },
  { emoji: '🔥', text: 'motivated' }
];

const BG_GRADIENTS = [
  { id: 'none', label: 'Plain', style: '' },
  { id: 'sapphire', label: 'Sapphire', style: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0284c7 100%)' },
  { id: 'sunset', label: 'Sunset', style: 'linear-gradient(135deg, #b91c1c 0%, #d97706 100%)' },
  { id: 'emerald', label: 'Emerald', style: 'linear-gradient(135deg, #065f46 0%, #0d9488 100%)' },
  { id: 'neon', label: 'Neon', style: 'linear-gradient(135deg, #6b21a8 0%, #be185d 100%)' }
];

export const CreatePostModal: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const {
    createPostModalOpen,
    closeCreatePostModal,
    openCreateStoryModal,
    showToast,
    triggerRefresh
  } = useApp();

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; text: string } | null>(null);
  const [location, setLocation] = useState('');
  const [mediaList, setMediaList] = useState<PostMedia[]>([]);
  const [backgroundGradient, setBackgroundGradient] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);

  if (!currentUser) {
    return null;
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const uploaded = await storageService.uploadMedia(file);
        setMediaList((prev) => [
          ...prev,
          {
            id: `media_${Date.now()}_${i}`,
            type: uploaded.type,
            url: uploaded.url,
            caption: file.name
          }
        ]);
        setBackgroundGradient('');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        showToast(msg, 'error');
      }
    }
  };

  const removeMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const handleClose = () => {
    closeCreatePostModal();
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaList.length === 0) {
      showToast('Please enter post text or upload photo/video.', 'info');
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.createPost({
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorUsername: currentUser.username,
        authorAvatar: currentUser.avatar,
        authorVerified: currentUser.isVerified,
        content: content.trim(),
        privacy,
        media: mediaList,
        feeling: selectedFeeling || undefined,
        location: location.trim() || undefined,
        backgroundGradient: backgroundGradient || undefined
      });

      showToast('Post created successfully! 🎉', 'success');
      // Reset form
      setContent('');
      setMediaList([]);
      setSelectedFeeling(null);
      setLocation('');
      setBackgroundGradient('');
      setShowFeelingsPicker(false);
      setShowLocationInput(false);
      setShowBackgroundPicker(false);
      triggerRefresh();
      closeCreatePostModal();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create post. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={createPostModalOpen} onClose={handleClose} maxWidth="lg" title="Create Post">
      <div className="space-y-4">
        {/* Author Header & Privacy Selection */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-blue-500"
            />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{currentUser.name}</span>
                {selectedFeeling && (
                  <span className="text-xs font-normal text-slate-500">
                    is {selectedFeeling.emoji} {selectedFeeling.text}
                  </span>
                )}
              </div>
              {location && (
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Pill */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {(['public', 'friends', 'only_me'] as PostPrivacy[]).map((p) => {
              const Icon = p === 'public' ? Globe : p === 'friends' ? Users : Lock;
              const label = p === 'public' ? 'Public' : p === 'friends' ? 'Friends' : 'Only Me';
              const isSelected = privacy === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrivacy(p)}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Input Area */}
        <div
          className={`relative rounded-2xl transition-all ${
            backgroundGradient
              ? 'p-6 sm:p-8 min-h-[160px] flex items-center justify-center text-center shadow-inner'
              : 'p-1'
          }`}
          style={{ background: backgroundGradient || undefined }}
        >
          <textarea
            rows={backgroundGradient ? 3 : 4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}? Share thoughts, photos, videos...`}
            className={`w-full resize-none bg-transparent outline-hidden transition-colors ${
              backgroundGradient
                ? 'text-white placeholder:text-white/70 text-lg sm:text-xl font-bold text-center'
                : 'text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base'
            }`}
          />
        </div>

        {/* Background Gradients Palette */}
        {showBackgroundPicker && mediaList.length === 0 && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 mr-1">Background:</span>
            {BG_GRADIENTS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => setBackgroundGradient(bg.style)}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  backgroundGradient === bg.style ? 'scale-115 border-blue-500 shadow-xs' : 'border-slate-300 dark:border-slate-700'
                }`}
                style={{ background: bg.style || '#cbd5e1' }}
                title={bg.label}
              />
            ))}
          </div>
        )}

        {/* Feelings Picker */}
        {showFeelingsPicker && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
              <span>How are you feeling right now?</span>
              {selectedFeeling && (
                <button
                  type="button"
                  onClick={() => setSelectedFeeling(null)}
                  className="text-rose-500 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FEELINGS.map((f) => (
                <button
                  key={f.text}
                  type="button"
                  onClick={() => {
                    setSelectedFeeling(f);
                    setShowFeelingsPicker(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 border transition-colors ${
                    selectedFeeling?.text === f.text
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span className="capitalize">{f.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Input Drawer */}
        {showLocationInput && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <MapPin className="w-4 h-4 text-rose-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location (e.g. Dhaka, San Francisco, Tokyo)..."
              className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-200 outline-hidden"
            />
            {location && (
              <button
                type="button"
                onClick={() => setLocation('')}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* Media Preview Grid */}
        {mediaList.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {mediaList.map((media) => (
              <div
                key={media.id}
                className="relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group h-32"
              >
                {media.type === 'image' ? (
                  <img src={media.url} alt="Uploaded" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                    <Video className="w-8 h-8 text-blue-400 mb-1" />
                    <span className="text-[10px] text-slate-300 px-2 text-center truncate w-full">
                      {media.caption || 'Video'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(media.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add to Post Toolbar */}
        <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
            Add to your post:
          </span>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Photos & Videos Upload */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors">
              <ImageIcon className="w-4 h-4" />
              <span>Photo/Video</span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
            </label>

            {/* Feelings */}
            <button
              type="button"
              onClick={() => setShowFeelingsPicker((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
            >
              <Smile className="w-4 h-4" />
              <span>Feeling</span>
            </button>

            {/* Location */}
            <button
              type="button"
              onClick={() => setShowLocationInput((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <MapPin className="w-4 h-4" />
              <span>Location</span>
            </button>

            {/* Theme Gradient */}
            {mediaList.length === 0 && (
              <button
                type="button"
                onClick={() => setShowBackgroundPicker((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
              >
                <Palette className="w-4 h-4" />
                <span>Color</span>
              </button>
            )}
          </div>
        </div>

        {/* Switch to Story Banner */}
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Want to share a 24-hour disappearing photo or story instead?</span>
          </div>
          <button
            type="button"
            onClick={() => {
              closeCreatePostModal();
              openCreateStoryModal();
            }}
            className="font-bold underline hover:text-blue-900 dark:hover:text-blue-100"
          >
            Create Story
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || (!content.trim() && mediaList.length === 0)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Publish Post</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};
