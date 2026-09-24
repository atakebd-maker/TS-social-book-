import React from 'react';
import { ReactionType } from '../../types';
import { REACTION_ICONS } from '../../services/reactionService';

interface ReactionPopoverProps {
  onSelectReaction: (reaction: ReactionType) => void;
  onClose?: () => void;
  className?: string;
}

export const ReactionPopover: React.FC<ReactionPopoverProps> = ({
  onSelectReaction,
  onClose,
  className = ''
}) => {
  const reactions: ReactionType[] = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];

  return (
    <div
      onMouseLeave={onClose}
      className={`absolute bottom-full left-0 mb-2 p-1.5 bg-white dark:bg-slate-900 rounded-full shadow-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-1.5 z-40 animate-in fade-in zoom-in-90 duration-150 ${className}`}
    >
      {reactions.map((type) => {
        const item = REACTION_ICONS[type];
        return (
          <button
            key={type}
            onClick={(e) => {
              e.stopPropagation();
              onSelectReaction(type);
              onClose?.();
            }}
            className="group relative w-10 h-10 rounded-full flex items-center justify-center hover:scale-130 active:scale-110 transition-transform duration-150 cursor-pointer select-none"
            title={item.label}
            aria-label={item.label}
          >
            <span className="text-2xl drop-shadow-sm transition-transform group-hover:-translate-y-1">
              {item.emoji}
            </span>

            {/* Floating tooltip label */}
            <span className="absolute -top-7 px-2 py-0.5 bg-slate-900/90 text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
