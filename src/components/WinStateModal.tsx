import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { World } from '../types';
import { useApp } from '../context/AppContext';
import { soundEngine } from '../utils/audio';
import { Trophy, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface WinStateModalProps {
  world: World;
  isOpen: boolean;
  onClose: () => void;
  onBackToWorlds: () => void;
}

export const WinStateModal: React.FC<WinStateModalProps> = ({
  world,
  isOpen,
  onClose,
  onBackToWorlds,
}) => {
  const { getWorldProgress, users } = useApp();
  const progress = getWorldProgress(world.id);

  useEffect(() => {
    if (!isOpen) return;

    // Play synthesized 8-bit victory fanfare
    soundEngine.playVictoryFanfare();

    // Trigger Pixelated Square Confetti & Fireworks
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      // Launch 2 confetti bursts from left and right
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        shapes: ['square'],
        colors: ['#4dedf4', '#55ff55', '#fcdc3b', '#ff2200', '#c084fc', '#ffffff'],
        scalar: 1.4,
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        shapes: ['square'],
        colors: ['#4dedf4', '#55ff55', '#fcdc3b', '#ff2200', '#c084fc', '#ffffff'],
        scalar: 1.4,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      {/* Central Celebration Box */}
      <div className="mc-panel w-full max-w-lg p-6 text-center text-white relative overflow-hidden border-4 border-[#55ff55] shadow-[0_0_35px_rgba(85,255,85,0.4)]">
        {/* Subtle Pixel Shimmer */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#55ff55]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#4dedf4]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Flashing 8-bit Banner */}
        <div className="my-2">
          <div className="mc-level-up-banner text-lg md:text-2xl font-bold tracking-widest text-[#fcdc3b]">
            ★ LEVEL UP! ★
          </div>
          <div className="text-sm md:text-lg font-bold text-[#55ff55] tracking-wider mt-1 mc-text-glow">
            WORLD CLEARED!
          </div>
        </div>

        {/* Trophy / Crown Graphic */}
        <div className="my-5 flex justify-center">
          <div className="w-20 h-20 bg-[#16291a] border-4 border-[#55ff55] flex items-center justify-center shadow-[0_0_20px_#55ff55]">
            <Trophy size={42} className="text-[#fcdc3b] animate-bounce" />
          </div>
        </div>

        {/* World Name & Summary */}
        <div className="p-3 bg-[#130e20] border-2 border-[#2f2249] my-4 text-left">
          <div className="flex items-center gap-2 text-[#4dedf4] text-xs font-bold truncate">
            <Sparkles size={14} className="flex-shrink-0" />
            <span>{world.name}</span>
          </div>
          <p className="text-[10px] text-slate-300 mt-1">
            All resource blocks successfully excavated! The world has reached 100% completion.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#261a3d] text-center text-[9px]">
            <div className="bg-[#172419] p-2 border border-[#2b6033]">
              <span className="text-slate-400 block text-[8px]">TOTAL HARVESTED</span>
              <span className="text-sm font-bold text-[#55ff55]">
                {progress.completedTasks} / {progress.totalTasks} BLOCKS
              </span>
            </div>
            <div className="bg-[#172419] p-2 border border-[#2b6033]">
              <span className="text-slate-400 block text-[8px]">TOTAL TEAM XP</span>
              <span className="text-sm font-bold text-[#4dedf4]">
                +{progress.earnedXp} XP (100%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={onBackToWorlds}
            className="mc-btn mc-btn-obsidian text-[10px] w-full sm:w-auto px-4 py-2"
          >
            <ArrowLeft size={13} className="inline mr-1" />
            RETURN TO WORLDS
          </button>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-emerald text-[10px] w-full sm:w-auto px-5 py-2"
          >
            <CheckCircle2 size={13} className="inline mr-1" />
            CONTINUE EXPLORING
          </button>
        </div>
      </div>
    </div>
  );
};
