import React, { useState, useEffect } from 'react';

interface AvatarProps {
  userId: string;
  avatarKey?: string;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export interface AvatarOption {
  key: string;
  name: string;
  color: string;
  category: 'zodiac' | 'minecraft';
  zodiacName?: string;
  image?: string;
}

/**
 * Safely resolves asset paths across all deployment environments:
 * 1. GitHub Pages subpath: https://nnhanvu299-cyber.github.io/minetask-1835/
 * 2. Localhost Vite dev: http://localhost:5173/
 * 3. Capacitor Native Android: capacitor://localhost
 */
export const resolveAssetPath = (path: string | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  // Strip any leading slashes or dots
  const clean = path.replace(/^(\.|\/)+/, '');

  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname || '';
    if (pathname.includes('/minetask-1835')) {
      return `/minetask-1835/${clean}`;
    }
  }

  const base = ((import.meta as any).env?.BASE_URL as string) || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}${clean}`;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  // ================= BỘ 12 CON GIÁP CUTE 3D =================
  { key: 'zodiac_ty', name: 'Tý - Chuột Vàng (Cute 3D)', color: '#f59e0b', category: 'zodiac', zodiacName: 'Tý (Chuột)', image: 'characters/zodiac_ty.jpg' },
  { key: 'zodiac_suu', name: 'Sửu - Trâu Vàng (Cute 3D)', color: '#8d6e63', category: 'zodiac', zodiacName: 'Sửu (Trâu)', image: 'characters/zodiac_suu.svg' },
  { key: 'zodiac_dan', name: 'Dần - Hổ Con (Cute 3D)', color: '#ea580c', category: 'zodiac', zodiacName: 'Dần (Hổ)', image: 'characters/zodiac_dan.svg' },
  { key: 'zodiac_mao', name: 'Mão - Mèo Con (Cute 3D)', color: '#f97316', category: 'zodiac', zodiacName: 'Mão (Mèo)', image: 'characters/zodiac_mao.svg' },
  { key: 'zodiac_thin', name: 'Thìn - Rồng Con (Cute 3D)', color: '#10b981', category: 'zodiac', zodiacName: 'Thìn (Rồng)', image: 'characters/zodiac_thin.svg' },
  { key: 'zodiac_ty_ran', name: 'Tỵ - Rắn Lục (Cute 3D)', color: '#059669', category: 'zodiac', zodiacName: 'Tỵ (Rắn)', image: 'characters/zodiac_ty_ran.svg' },
  { key: 'zodiac_ngo', name: 'Ngọ - Ngựa Pony (Cute 3D)', color: '#b45309', category: 'zodiac', zodiacName: 'Ngọ (Ngựa)', image: 'characters/zodiac_ngo.svg' },
  { key: 'zodiac_mui', name: 'Mùi - Dê Mây (Cute 3D)', color: '#cbd5e1', category: 'zodiac', zodiacName: 'Mùi (Dê)', image: 'characters/zodiac_mui.svg' },
  { key: 'zodiac_than', name: 'Thân - Khỉ Con (Cute 3D)', color: '#a16207', category: 'zodiac', zodiacName: 'Thân (Khỉ)', image: 'characters/zodiac_than.svg' },
  { key: 'zodiac_dau', name: 'Dậu - Gà Con (Cute 3D)', color: '#eab308', category: 'zodiac', zodiacName: 'Dậu (Gà)', image: 'characters/zodiac_dau.svg' },
  { key: 'zodiac_tuat', name: 'Tuất - Cún Shiba (Cute 3D)', color: '#f97316', category: 'zodiac', zodiacName: 'Tuất (Chó)', image: 'characters/zodiac_tuat.svg' },
  { key: 'zodiac_hoi', name: 'Hợi - Heo Hồng (Cute 3D)', color: '#ec4899', category: 'zodiac', zodiacName: 'Hợi (Heo)', image: 'characters/zodiac_hoi.svg' },

  // ================= MINECRAFT 3D =================
  { key: 'steve', name: 'Steve (Thợ mỏ 3D)', color: '#F37022', category: 'minecraft', image: 'characters/steve.jpg' },
  { key: 'alex', name: 'Alex (Chế tác 3D)', color: '#ED1B24', category: 'minecraft', image: 'characters/alex.jpg' },
  { key: 'sniffer', name: 'Sniffer (Cổ đại hoa 3D)', color: '#e69900', category: 'minecraft', image: 'characters/sniffer.jpg' },
  { key: 'axolotl', name: 'Axolotl (Kỳ nhông hồng 3D)', color: '#fbb4cb', category: 'minecraft', image: 'characters/axolotl.jpg' },
  { key: 'creeper', name: 'Creeper (Bộc phá 3D)', color: '#509e3a', category: 'minecraft', image: 'characters/creeper.jpg' },
  { key: 'devon', name: 'Devon (Redstone 3D)', color: '#753B94', category: 'minecraft', image: 'characters/devon.jpg' },
  { key: 'luna', name: 'Luna (Nether Knight 3D)', color: '#0072CE', category: 'minecraft', image: 'characters/luna.jpg' },
  { key: 'enderman', name: 'Enderman (Bóng đêm 3D)', color: '#161616', category: 'minecraft', image: 'characters/enderman.jpg' },
  { key: 'zombie', name: 'Zombie (Xác sống 3D)', color: '#568C52', category: 'minecraft', image: 'characters/zombie.jpg' },
  { key: 'skeleton', name: 'Skeleton (Cung thủ 3D)', color: '#c7c7c7', category: 'minecraft', image: 'characters/skeleton.jpg' },
  { key: 'iron_golem', name: 'Iron Golem (Hộ vệ 3D)', color: '#d1d1d1', category: 'minecraft', image: 'characters/iron_golem.jpg' },
  { key: 'fox', name: 'Cáo Tuyết / Hoa 3D)', color: '#d9651e', category: 'minecraft', image: 'characters/fox.jpg' },
  { key: 'blaze', name: 'Blaze (Quỷ lửa 3D)', color: '#f5b025', category: 'minecraft' },
  { key: 'piglin', name: 'Piglin (Nether Gold 3D)', color: '#d98579', category: 'minecraft' },
  { key: 'villager', name: 'Villager (Thương nhân 3D)', color: '#8F5434', category: 'minecraft' },
  { key: 'cyber', name: 'Cyber Miner 1835 3D', color: '#D10074', category: 'minecraft' },
];

export const AVATAR_3D_IMAGES: Record<string, string> = {
  // 12 Con Giáp Cute 3D
  zodiac_ty: 'characters/zodiac_ty.jpg',
  zodiac_suu: 'characters/zodiac_suu.svg',
  zodiac_dan: 'characters/zodiac_dan.svg',
  zodiac_mao: 'characters/zodiac_mao.svg',
  zodiac_thin: 'characters/zodiac_thin.svg',
  zodiac_ty_ran: 'characters/zodiac_ty_ran.svg',
  zodiac_ngo: 'characters/zodiac_ngo.svg',
  zodiac_mui: 'characters/zodiac_mui.svg',
  zodiac_than: 'characters/zodiac_than.svg',
  zodiac_dau: 'characters/zodiac_dau.svg',
  zodiac_tuat: 'characters/zodiac_tuat.svg',
  zodiac_hoi: 'characters/zodiac_hoi.svg',

  // Minecraft 3D
  steve: 'characters/steve.jpg',
  alex: 'characters/alex.jpg',
  sniffer: 'characters/sniffer.jpg',
  axolotl: 'characters/axolotl.jpg',
  creeper: 'characters/creeper.jpg',
  devon: 'characters/devon.jpg',
  luna: 'characters/luna.jpg',
  enderman: 'characters/enderman.jpg',
  zombie: 'characters/zombie.jpg',
  skeleton: 'characters/skeleton.jpg',
  iron_golem: 'characters/iron_golem.jpg',
  fox: 'characters/fox.jpg',
};

// 3D Isometric Voxel Cube Face Renderer (used for fallback or SVG mode)
const renderIsometric3DFace = (key: string) => {
  switch (key) {
    case 'alex':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.25)" />
          {/* Top Hair Face */}
          <polygon points="16,3 28,10 16,17 4,10" fill="#e07534" />
          {/* Front Face (Eyes, Hair, Mouth) */}
          <polygon points="4,10 16,17 16,29 4,22" fill="#f0c2a8" />
          {/* Front Face features */}
          <polygon points="4,10 16,17 16,19 4,12" fill="#c75c1c" />
          <polygon points="6,15 8,16 8,18 6,17" fill="#ffffff" />
          <polygon points="8,16 10,17 10,19 8,18" fill="#22964b" />
          <polygon points="9,24 11,25 11,26 9,25" fill="#ba6f59" />
          {/* Right Face (Side hair with 3D shadow) */}
          <polygon points="16,17 28,10 28,22 16,29" fill="#a44e1a" />
          <polygon points="16,17 28,10 28,14 16,21" fill="#8a3e12" />
        </svg>
      );

    case 'creeper':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.3)" />
          {/* Top Face */}
          <polygon points="16,3 28,10 16,17 4,10" fill="#5db947" />
          {/* Front Face */}
          <polygon points="4,10 16,17 16,29 4,22" fill="#479e35" />
          {/* Creeper Eyes & Mouth on front face */}
          <polygon points="6,14 9,16 9,19 6,17" fill="#111111" />
          <polygon points="11,17 14,19 14,22 11,20" fill="#111111" />
          <polygon points="9,18 12,20 12,24 9,22" fill="#111111" />
          {/* Right Face (shaded) */}
          <polygon points="16,17 28,10 28,22 16,29" fill="#327324" />
          <polygon points="19,15 22,13 22,16 19,18" fill="#245719" />
        </svg>
      );

    case 'sniffer':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="11" ry="2" fill="rgba(45,26,17,0.3)" />
          {/* Top Moss Face */}
          <polygon points="16,4 28,11 16,18 4,11" fill="#3d822b" />
          {/* Front Face (Reddish snout) */}
          <polygon points="4,11 16,18 16,29 4,22" fill="#a32828" />
          <polygon points="6,18 14,23 14,28 6,23" fill="#e89e0c" />
          <polygon points="8,21 10,22 10,24 8,23" fill="#241103" />
          {/* Right Face with Floppy Yellow Ear */}
          <polygon points="16,18 28,11 28,22 16,29" fill="#781d1d" />
          <polygon points="21,15 26,12 26,20 21,23" fill="#e89e0c" />
        </svg>
      );

    case 'axolotl':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.2)" />
          {/* Top Face */}
          <polygon points="16,5 27,11 16,17 5,11" fill="#ffc2d1" />
          {/* Gills on top/sides */}
          <polygon points="4,9 2,8 3,12 5,11" fill="#e63980" />
          <polygon points="27,11 29,10 30,14 28,13" fill="#c22567" />
          {/* Front Face */}
          <polygon points="5,11 16,17 16,28 5,22" fill="#fba1b7" />
          <polygon points="7,16 9,17 9,19 7,18" fill="#1a0c02" />
          <polygon points="12,19 14,20 14,22 12,21" fill="#1a0c02" />
          <polygon points="9,23 12,25 12,26 9,24" fill="#e63980" />
          {/* Right Face */}
          <polygon points="16,17 27,11 27,22 16,28" fill="#db7f97" />
        </svg>
      );

    case 'enderman':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="9" ry="2" fill="rgba(147,51,234,0.3)" />
          {/* Top Face */}
          <polygon points="16,4 27,10 16,16 5,10" fill="#242424" />
          {/* Front Face */}
          <polygon points="5,10 16,16 16,28 5,22" fill="#141414" />
          {/* Glowing Purple Eyes */}
          <polygon points="7,15 11,17 11,19 7,17" fill="#c026d3" />
          <polygon points="8,16 10,17 10,18 8,17" fill="#f0abfc" />
          {/* Right Face */}
          <polygon points="16,16 27,10 27,22 16,28" fill="#0a0a0a" />
          <polygon points="19,15 23,13 23,15 19,17" fill="#c026d3" />
        </svg>
      );

    case 'blaze':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="9" ry="2" fill="rgba(245,158,11,0.35)" />
          <polygon points="16,4 27,10 16,16 5,10" fill="#fbbf24" />
          <polygon points="5,10 16,16 16,28 5,22" fill="#f59e0b" />
          <polygon points="7,15 9,16 9,18 7,17" fill="#ffffff" />
          <polygon points="8,16 9,17 9,18 8,17" fill="#78350f" />
          <polygon points="12,18 14,19 14,21 12,20" fill="#ffffff" />
          <polygon points="13,19 14,20 14,21 13,20" fill="#78350f" />
          <polygon points="16,16 27,10 27,22 16,28" fill="#d97706" />
          {/* Floating Blaze Smoke Rods */}
          <rect x="2" y="14" width="2" height="6" fill="#fde68a" />
          <rect x="28" y="12" width="2" height="6" fill="#f59e0b" />
        </svg>
      );

    case 'piglin':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.3)" />
          <polygon points="16,4 27,10 16,16 5,10" fill="#f4a59a" />
          <polygon points="5,10 16,16 16,28 5,22" fill="#e88f82" />
          {/* Eyes and tusks */}
          <polygon points="7,14 9,15 9,17 7,16" fill="#ffffff" />
          <polygon points="8,15 9,16 9,17 8,16" fill="#111111" />
          <polygon points="12,17 14,18 14,20 12,19" fill="#ffffff" />
          <polygon points="13,18 14,19 14,20 13,19" fill="#111111" />
          {/* Snout */}
          <polygon points="8,19 13,22 13,26 8,23" fill="#d47568" />
          <polygon points="7,23 8,24 8,26 7,25" fill="#ffffff" />
          <polygon points="16,16 27,10 27,22 16,28" fill="#c26356" />
          {/* Ear */}
          <polygon points="27,12 30,14 30,18 27,16" fill="#b05448" />
        </svg>
      );

    case 'villager':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.3)" />
          <polygon points="16,3 27,9 16,15 5,9" fill="#8f5434" />
          <polygon points="5,9 16,15 16,29 5,23" fill="#c4936d" />
          {/* Green eyes */}
          <polygon points="7,14 9,15 9,17 7,16" fill="#ffffff" />
          <polygon points="8,15 9,16 9,17 8,16" fill="#16a34a" />
          <polygon points="12,17 14,18 14,20 12,19" fill="#ffffff" />
          <polygon points="13,18 14,19 14,20 13,19" fill="#16a34a" />
          {/* Iconic Long Nose */}
          <polygon points="9,18 13,20 13,27 9,25" fill="#a4724c" />
          <polygon points="16,15 27,9 27,23 16,29" fill="#a1704c" />
        </svg>
      );

    case 'cyber':
      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(243,112,34,0.3)" />
          <polygon points="16,3 28,10 16,17 4,10" fill="#2D1A11" />
          <polygon points="16,3 22,6 16,10 10,6" fill="#F37022" />
          <polygon points="4,10 16,17 16,29 4,22" fill="#1a120e" />
          {/* Neon Visor */}
          <polygon points="5,14 15,20 15,23 5,17" fill="url(#cyberVisorGrad)" />
          <defs>
            <linearGradient id="cyberVisorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F37022" />
              <stop offset="50%" stopColor="#ED1B24" />
              <stop offset="100%" stopColor="#0072CE" />
            </linearGradient>
          </defs>
          <polygon points="16,17 28,10 28,22 16,29" fill="#0d0806" />
        </svg>
      );

    case 'steve':
    default:
      if (key.startsWith('zodiac_')) {
        const zodiacMap: Record<string, { emoji: string; name: string; bg: string }> = {
          zodiac_ty: { emoji: '🐭', name: 'Tý', bg: '#fef3c7' },
          zodiac_suu: { emoji: '🐮', name: 'Sửu', bg: '#f5ebe0' },
          zodiac_dan: { emoji: '🐯', name: 'Dần', bg: '#ffedd5' },
          zodiac_mao: { emoji: '🐱', name: 'Mão', bg: '#fed7aa' },
          zodiac_thin: { emoji: '🐲', name: 'Thìn', bg: '#d1fae5' },
          zodiac_ty_ran: { emoji: '🐍', name: 'Tỵ', bg: '#a7f3d0' },
          zodiac_ngo: { emoji: '🐴', name: 'Ngọ', bg: '#fde68a' },
          zodiac_mui: { emoji: '🐐', name: 'Mùi', bg: '#f1f5f9' },
          zodiac_than: { emoji: '🐵', name: 'Thân', bg: '#fef08a' },
          zodiac_dau: { emoji: '🐔', name: 'Dậu', bg: '#fef9c3' },
          zodiac_tuat: { emoji: '🐶', name: 'Tuất', bg: '#fed7aa' },
          zodiac_hoi: { emoji: '🐷', name: 'Hợi', bg: '#fce7f3' },
        };
        const z = zodiacMap[key] || { emoji: '✨', name: 'Zodiac', bg: '#FAF2DC' };
        return (
          <div
            style={{ backgroundColor: z.bg }}
            className="w-full h-full flex flex-col items-center justify-center select-none"
          >
            <span className="text-sm leading-none">{z.emoji}</span>
            <span className="text-[7px] font-bold text-[#2D1A11] mt-0.5">{z.name}</span>
          </div>
        );
      }

      return (
        <svg viewBox="0 0 32 32" width="100%" height="100%" className="block">
          <ellipse cx="16" cy="30" rx="10" ry="2" fill="rgba(45,26,17,0.3)" />
          {/* Top Hair Face */}
          <polygon points="16,3 28,10 16,17 4,10" fill="#5a381e" />
          {/* Front Face (Skin + Beard + Eyes) */}
          <polygon points="4,10 16,17 16,29 4,22" fill="#bd8b72" />
          {/* Hair bangs */}
          <polygon points="4,10 16,17 16,19 4,12" fill="#4a2e18" />
          {/* Eyes (Left & Right with 3D angle) */}
          <polygon points="6,15 8,16 8,18 6,17" fill="#ffffff" />
          <polygon points="8,16 10,17 10,19 8,18" fill="#2d3a82" />
          <polygon points="12,18 14,19 14,21 12,20" fill="#ffffff" />
          <polygon points="13,19 14,20 14,21 13,20" fill="#2d3a82" />
          {/* Beard / Mouth */}
          <polygon points="8,23 13,26 13,28 8,25" fill="#4a2e18" />
          <polygon points="9,24 12,26 12,27 9,25" fill="#7a4628" />
          {/* Right Face (Side hair with 3D shadow) */}
          <polygon points="16,17 28,10 28,22 16,29" fill="#3d2513" />
        </svg>
      );
  }
};

export const PixelAvatar: React.FC<AvatarProps> = React.memo(({
  userId,
  avatarKey,
  size = 48,
  className = '',
  showBorder = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const key = (avatarKey || userId || 'steve').toLowerCase().trim();
  const rawPath = AVATAR_3D_IMAGES[key];
  const imageUrl = rawPath ? resolveAssetPath(rawPath) : undefined;

  // Whenever avatar key changes, reset error state so new avatar loads immediately
  useEffect(() => {
    setImageError(false);
  }, [key, rawPath]);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center flex-shrink-0 select-none overflow-hidden rounded-xs ${
        showBorder ? 'mc-avatar-frame' : ''
      } ${className}`}
      title={key}
    >
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={key}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover block transition-transform duration-200"
          loading="lazy"
        />
      ) : (
        renderIsometric3DFace(key)
      )}
    </div>
  );
});
