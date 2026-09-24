import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  Tag,
  Globe,
  Users,
  Lock,
  X,
  Palette,
  Eye,
  Send,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { postService } from '../../services/postService';
import { storageService } from '../../services/storageService';
import { PostPrivacy, PostMedia } from '../../types';
import { Modal } from '../common/Modal';

const FEELINGS = [
  { emoji: '😊', text: 'happy' },
  { emoji: '🚀', text: 'energized' },
  { emoji: '✨', text: 'blessed' },
  { emoji: '☕', text: 'drinking coffee' },
  { emoji: '💻', text: 'coding' },
  { emoji: '🎉', text: 'celebrating' },
  { emoji: '✈️', text: 'traveling' },
  { emoji: '🎧', text: 'listening to music' }
];

const BG_GRADIENTS = [
  { id: 'none', label: 'Plain', style: '' },
  { id: 'sapphire', label: 'Sapphire', style: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0284c7 100%)' },
  { id: 'sunset', label: 'Sunset', style: 'linear-gradient(135deg, #b91c1c 0%, #d97706 100%)' },
  { id: 'emerald', label: 'Emerald', style: 'linear-gradient(135deg, #065f46 0%, #0d9488 100%)' },
  { id: 'neon', label: 'Neon', style: 'linear-gradient(135deg, #6b21a8 0%, #be185d 100%)' }
];

export const CreatePostCard: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { showToast, triggerRefresh, navigateToProfile } = useApp();

  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<PostPrivacy>('public');
  const [selectedFeeling, setSelectedFeeling] = useState<{ emoji: string; text: string } | null>(null);
  const [location, setLocation] = useState('');
  const [mediaList, setMediaList] = useState<PostMedia[]>([]);
  const [backgroundGradient, setBackgroundGradient] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picker drawers/popovers
  const [showFeelingsPicker, setShowFeelingsPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs mb-6 text-center">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">
          Join the conversation on TS Social Book
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Sign in or create a profile to share posts, stories, and connect with people.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
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
        // Disable gradient when media is attached
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

  const handleSubmit = async () => {
    if (!content.trim() && mediaList.length === 0) {
      showToast('Please add some text or media to your post.', 'info');
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

      showToast('Post published successfully!', 'success');
      // Reset form
      setContent('');
      setMediaList([]);
      setSelectedFeeling(null);
      setLocation('');
      setBackgroundGradient('');
      setShowFeelingsPicker(false);
      setShowLocationInput(false);
      setShowBackgroundPicker(false);
      setShowPreviewModal(false);
      triggerRefresh();
    } catch {
      showToast('Failed to publish post', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs mb-6 transition-all">
      {/* Top Author Row & Privacy */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div
          onClick={() => navigateToProfile(currentUser.id)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/80 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
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

        {/* Privacy Selector */}
        <div className="relative">
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
            aria-label="Post privacy"
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-1.5 pl-2.5 pr-6 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="public">🌐 Public</option>
            <option value="friends">👥 Friends</option>
            <option value="only_me">🔒 Only Me</option>
          </select>
        </div>
      </div>

      {/* Post Text Input / Styled Background Canvas */}
      <div
        className={`rounded-2xl transition-all ${
          backgroundGradient
            ? 'p-6 min-h-36 flex items-center justify-center text-center shadow-inner'
            : 'bg-slate-50 dark:bg-slate-800/50 p-2'
        }`}
        style={{ background: backgroundGradient || undefined }}
      >
        <textarea
          rows={backgroundGradient ? 4 : 3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}? (Use #hashtags and @mentions)`}
          className={`w-full bg-transparent border-0 focus:outline-none focus:ring-0 resize-none ${
            backgroundGradient
              ? 'text-white text-lg font-bold placeholder-white/70 text-center leading-relaxed'
              : 'text-sm text-slate-900 dark:text-white placeholder-slate-400 p-2'
          }`}
        />
      </div>

      {/* Media Attachments Preview Grid */}
      {mediaList.length > 0 && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {mediaList.map((m) => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-video">
              {m.type === 'image' ? (
                <img src={m.url} alt="Attachment" className="w-full h-full object-cover" />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" />
              )}
              <button
                onClick={() => removeMedia(m.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                aria-label="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Location Input Drawer */}
      {showLocationInput && (
        <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Add location (e.g., San Francisco, CA or Dhaka, Bangladesh)"
            className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none"
          />
          {location && (
            <button
              onClick={() => {
                setLocation('');
                setShowLocationInput(false);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Feelings Picker Drawer */}
      {showFeelingsPicker && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            How are you feeling right now?
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FEELINGS.map((f) => (
              <button
                key={f.text}
                onClick={() => {
                  setSelectedFeeling(f);
                  setShowFeelingsPicker(false);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  selectedFeeling?.text === f.text
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'
                }`}
              >
                <span>{f.emoji}</span>
                <span>{f.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Background Palette Drawer */}
      {showBackgroundPicker && mediaList.length === 0 && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Card Background Style
          </div>
          <div className="flex items-center gap-2">
            {BG_GRADIENTS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setBackgroundGradient(bg.style)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  backgroundGradient === bg.style ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-105'
                }`}
                style={{
                  background: bg.style || '#f1f5f9'
                }}
                title={bg.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Photo / Video Upload */}
          <label className="p-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">Photo/Video</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="hidden"
            />
          </label>

          {/* Feeling / Activity */}
          <button
            onClick={() => setShowFeelingsPicker((prev) => !prev)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Feeling</span>
          </button>

          {/* Location */}
          <button
            onClick={() => setShowLocationInput((prev) => !prev)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="hidden sm:inline">Location</span>
          </button>

          {/* Background Styler (Only available if no media) */}
          {mediaList.length === 0 && (
            <button
              onClick={() => setShowBackgroundPicker((prev) => !prev)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <Palette className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Style</span>
            </button>
          )}
        </div>

        {/* Live Preview & Post Publish Buttons */}
        <div className="flex items-center gap-2">
          {(content.trim() || mediaList.length > 0) && (
            <button
              onClick={() => setShowPreviewModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1"
              title="Preview post before sharing"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          )}

          <button
            disabled={isSubmitting || (!content.trim() && mediaList.length === 0)}
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-all active:scale-95"
          >
            {isSubmitting ? (
              <span>Publishing...</span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Publish Post</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="Post Live Preview"
          maxWidth="lg"
        >
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {currentUser.name}
                  {selectedFeeling && (
                    <span className="text-xs font-normal text-slate-500">
                      is {selectedFeeling.emoji} {selectedFeeling.text}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1">
                  <span>Just now</span>
                  <span>•</span>
                  <span>{privacy === 'public' ? 'Public' : privacy === 'friends' ? 'Friends' : 'Only Me'}</span>
                  {location && <span>• {location}</span>}
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl mb-3 ${
                backgroundGradient ? 'p-8 text-center text-white text-lg font-bold' : 'text-sm text-slate-800 dark:text-slate-100'
              }`}
              style={{ background: backgroundGradient || undefined }}
            >
              {content || <span className="italic text-slate-400">No text caption</span>}
            </div>

            {mediaList.length > 0 && (
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                {mediaList.map((m) => (
                  <img key={m.id} src={m.url} alt="Media" className="w-full h-44 object-cover" />
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Back to Edit
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
            >
              Confirm & Publish
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
