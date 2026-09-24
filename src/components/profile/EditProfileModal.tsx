import React, { useState } from 'react';
import { Camera, Check, Globe, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Modal } from '../common/Modal';
import { UserProfile } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, user }) => {
  const { updateCurrentUser } = useAuth();
  const { showToast, triggerRefresh } = useApp();

  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [work, setWork] = useState(user.work || '');
  const [education, setEducation] = useState(user.education || '');
  const [website, setWebsite] = useState(user.website || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [coverPhoto, setCoverPhoto] = useState(user.coverPhoto);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await storageService.uploadMedia(file);
      setAvatar(res.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await storageService.uploadMedia(file);
      setCoverPhoto(res.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      showToast(msg, 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error');
      return;
    }

    try {
      setIsSaving(true);
      await updateCurrentUser({
        name: name.trim(),
        bio: bio.trim(),
        location: location.trim(),
        work: work.trim(),
        education: education.trim(),
        website: website.trim(),
        avatar,
        coverPhoto
      });

      showToast('Profile updated successfully!', 'success');
      triggerRefresh();
      onClose();
    } catch {
      showToast('Could not save profile changes', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Profile Details" maxWidth="lg">
      <form onSubmit={handleSave} className="space-y-4">
        {/* Cover Photo Preview & Edit */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Cover Photo
          </label>
          <div className="relative h-32 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800">
            <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
            <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 backdrop-blur-xs transition-colors">
              <Camera className="w-3.5 h-3.5" />
              <span>Change Cover</span>
              <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Avatar Preview & Edit */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-500 shrink-0">
            <img src={avatar} alt={name} className="w-full h-full object-cover" />
            <label className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white cursor-pointer transition-colors">
              <Camera className="w-5 h-5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Profile Photo
            </div>
            <p className="text-xs text-slate-500">
              Upload a square JPG, PNG, or WEBP image.
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Bio
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell the community about yourself..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Occupation / Work
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={work}
                onChange={(e) => setWork(e.target.value)}
                placeholder="Software Engineer"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Education
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="University / Degree"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Website
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://mysite.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
