import React, { useState } from 'react';
import { Flag, ShieldAlert, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { reportService } from '../../services/reportService';
import { ReportCategory } from '../../types';

const REPORT_CATEGORIES: { id: ReportCategory; label: string; desc: string }[] = [
  { id: 'spam', label: 'Spam or Fraud', desc: 'Misleading links, scam promotions, or bot activity' },
  { id: 'harassment', label: 'Harassment & Bullying', desc: 'Direct abuse, unwanted contact, or intimidation' },
  { id: 'hate_speech', label: 'Hate Speech & Discrimination', desc: 'Attacks based on identity, race, or religion' },
  { id: 'fake_account', label: 'Impersonation or Fake Profile', desc: 'Pretending to be someone else or deceptive profile' },
  { id: 'violence', label: 'Violence or Dangerous Content', desc: 'Threats of harm or inciting danger' },
  { id: 'nudity', label: 'Nudity or Sexual Content', desc: 'Explicit sexual imagery or solicitation' },
  { id: 'other', label: 'Something Else', desc: 'Issue not listed in the categories above' }
];

export const ReportModal: React.FC = () => {
  const { currentUser, openAuthModal } = useAuth();
  const { reportTarget, closeReportModal, showToast } = useApp();

  const [category, setCategory] = useState<ReportCategory>('spam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!reportTarget) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    try {
      setIsSubmitting(true);
      await reportService.submitReport({
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        targetAuthorName: reportTarget.authorName,
        targetSnippet: reportTarget.snippet,
        category,
        description: description.trim() || undefined
      });

      showToast('Thank you for helping keep TS Social Book safe. Our moderation team has received your report.', 'success');
      closeReportModal();
      setDescription('');
    } catch {
      showToast('Could not submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={Boolean(reportTarget)} onClose={closeReportModal} title="Report Content" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-800 dark:text-rose-300 leading-snug">
            Reporting a {reportTarget.type} by{' '}
            <span className="font-bold">{reportTarget.authorName}</span>. Reports are reviewed by community moderators.
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Why are you reporting this?
          </label>
          <div className="space-y-2">
            {REPORT_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-colors ${
                  category === cat.id
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="reportCategory"
                  checked={category === cat.id}
                  onChange={() => setCategory(cat.id)}
                  className="mt-0.5 text-blue-600"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    {cat.label}
                  </div>
                  <div className="text-[11px] text-slate-500">{cat.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Additional details (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Help our moderation team understand the context..."
            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={closeReportModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-rose-500/25 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
