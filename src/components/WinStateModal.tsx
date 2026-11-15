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
  const { getWorldProgress } = useApp();
  const progress = getWorldProgress(world.id);

  useEffect(() => {
    if (!isOpen) return;

    // Phát âm thanh khải hoàn khúc 8-bit
    soundEngine.playVictoryFanfare();

    // Kích hoạt pháo hoa hạt vuông với Dải màu Gradient 1835s: Cam #F37022 -> Đỏ #ED1B24 -> Magenta #D10074 -> Tím #753B94 -> Xanh #0072CE
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      // 1835s Brand Confetti Palette
      const colors1835 = ['#F37022', '#ED1B24', '#D10074', '#753B94', '#0072CE', '#FAF2DC', '#2D1A11'];

      confetti({
        particleCount: 8,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        shapes: ['square'],
        colors: colors1835,
        scalar: 1.4,
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        shapes: ['square'],
        colors: colors1835,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Central Celebration Box in 1835s Palette */}
      <div className="mc-panel w-full max-w-lg p-6 text-center bg-[#FDF7E7] text-[#2D1A11] relative overflow-hidden border-4 border-[#2D1A11] shadow-[0_0_35px_rgba(243,112,34,0.4)]">
        {/* Subtle Ambient 1835s Gradient Glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#F37022]/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#0072CE]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Flashing 8-bit Banner with 1835s Gradient */}
        <div className="my-2">
          <div className="mc-level-up-banner text-2xl md:text-3xl font-bold tracking-widest text-[#F37022]">
            ★ LÊN CẤP! THẾ GIỚI HOÀN THÀNH ★
          </div>
          <div className="text-sm md:text-base font-bold text-[#2D1A11] tracking-wider mt-1">
            ĐỘI 1835s ĐÃ CHINH PHỤC TOÀN BỘ CÁC TRẠM ZICZAC!
          </div>
        </div>

        {/* Trophy Graphic */}
        <div className="my-5 flex justify-center">
          <div className="w-20 h-20 bg-[#FAF2DC] border-4 border-[#2D1A11] flex items-center justify-center shadow-[4px_4px_0px_#2D1A11]">
            <Trophy size={42} className="text-[#F37022] animate-bounce" />
          </div>
        </div>

        {/* World Name & Summary */}
        <div className="p-3 bg-[#FAF2DC] border-2 border-[#2D1A11] my-4 text-left">
          <div className="flex items-center gap-2 text-[#2D1A11] text-sm font-bold truncate">
            <Sparkles size={16} className="flex-shrink-0 text-[#F37022]" />
            <span>{world.name}</span>
          </div>
          <p className="text-xs text-[#52372A] mt-1">
            Toàn bộ khối tài nguyên đã được khai thác thành công! Tiến độ đạt mốc tối đa 100%.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#2D1A11]/20 text-center">
            <div className="bg-[#FFFDF7] p-2 border border-[#2D1A11]">
              <span className="text-[#52372A] block text-[10px] font-bold">KHỐI THU HOẠCH</span>
              <span className="text-base font-bold text-[#2D1A11]">
                {progress.completedTasks} / {progress.totalTasks} KHỐI
              </span>
            </div>
            <div className="bg-[#FFFDF7] p-2 border border-[#2D1A11]">
              <span className="text-[#52372A] block text-[10px] font-bold">XP ĐỘI 1835s</span>
              <span className="text-base font-bold text-[#F37022]">
                +{progress.earnedXp} XP (100%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            onClick={onBackToWorlds}
            className="mc-btn mc-btn-obsidian text-sm w-full sm:w-auto px-4 py-2"
          >
            <ArrowLeft size={14} className="inline mr-1" />
            VỀ DANH SÁCH THẾ GIỚI
          </button>
          <button
            onClick={onClose}
            className="mc-btn mc-btn-1835 text-sm w-full sm:w-auto px-5 py-2 font-bold"
          >
            <CheckCircle2 size={14} className="inline mr-1" />
            TIẾP TỤC KHÁM PHÁ
          </button>
        </div>
      </div>
    </div>
  );
};
