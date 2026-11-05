import React from 'react';

interface XPBarProps {
  currentXp: number;
  totalXp: number;
  percentage: number;
  level?: number;
  label?: string;
  showDetails?: boolean;
  className?: string;
}

export const XPBar: React.FC<XPBarProps> = ({
  currentXp,
  totalXp,
  percentage,
  level,
  label = 'TEAM XP',
  showDetails = true,
  className = '',
}) => {
  const displayPercentage = Math.min(100, Math.max(0, percentage));
  const displayLevel = level !== undefined ? level : Math.floor(currentXp / 100);

  return (
    <div className={`mc-xp-container select-none ${className}`}>
      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-1 text-[10px] tracking-wider text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-[#55ff55] font-bold">▶ {label}</span>
          <span className="bg-[#122e17] text-[#7cf6a5] px-1.5 py-0.5 border border-[#2b6d39]">
            {displayPercentage}%
          </span>
        </div>
        {showDetails && (
          <div className="text-slate-400">
            <span className="text-[#55ff55] font-bold">{currentXp}</span>
            <span className="text-slate-500"> / </span>
            <span>{totalXp} XP</span>
          </div>
        )}
      </div>

      {/* The Iconic Minecraft XP Bar */}
      <div className="relative">
        <div className="mc-xp-bar-bg flex items-center">
          {/* Segment Tick Marks Overlay */}
          <div
            className="mc-xp-bar-fill"
            style={{ width: `${displayPercentage}%` }}
          />
        </div>

        {/* Center Minecraft Level Number */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <span className="mc-xp-level-badge text-xs drop-shadow-md">
            {displayLevel}
          </span>
        </div>
      </div>
    </div>
  );
};
