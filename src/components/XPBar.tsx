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
  level = 0,
  label = 'TIẾN ĐỘ XP ĐỘI 1835s',
  showDetails = true,
  className = '',
}) => {
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={`mc-xp-container select-none ${className}`}>
      {/* Top Header Label */}
      <div className="flex items-center justify-between mb-1.5 text-xs text-[#2D1A11]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wide text-[#2D1A11]">
            ▶ {label}
          </span>
          <span className="bg-[#FAF2DC] text-[#2D1A11] px-2 py-0.5 border-2 border-[#2D1A11] font-bold text-xs">
            {displayPercentage}%
          </span>
        </div>
        {showDetails && (
          <div className="text-xs font-semibold text-[#52372A]">
            <span className="text-[#F37022] font-bold text-sm">{currentXp}</span>
            <span className="text-[#836251]"> / </span>
            <span>{totalXp} XP</span>
          </div>
        )}
      </div>

      {/* The 1835s Gradient XP Bar */}
      <div className="relative">
        <div className="mc-xp-bar-bg flex items-center">
          {/* Segment Tick Marks Overlay with 1835s Gradient */}
          <div
            className="mc-xp-bar-fill"
            style={{ width: `${displayPercentage}%` }}
          />
        </div>

        {/* Center Level Badge (Starts from Level 0) */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <span className="mc-xp-level-badge text-base drop-shadow-md">
            Lv. {level}
          </span>
        </div>
      </div>
    </div>
  );
};
