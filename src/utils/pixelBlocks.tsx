import React from 'react';
import { BlockConfig, BlockRarity, BiomeType } from '../types';

export const BLOCK_CONFIGS: Record<BlockRarity, BlockConfig> = {
  coal: {
    type: 'coal',
    name: 'Quặng Than',
    xp: 40,
    primaryColor: '#2b2b2b',
    secondaryColor: '#454545',
    accentColor: '#141414',
    label: 'Việc Nhanh',
  },
  iron: {
    type: 'iron',
    name: 'Quặng Sắt',
    xp: 80,
    primaryColor: '#c8a48b',
    secondaryColor: '#d6c0b3',
    accentColor: '#8a6851',
    label: 'Việc Tiêu Chuẩn',
  },
  gold: {
    type: 'gold',
    name: 'Quặng Vàng',
    xp: 140,
    primaryColor: '#fcdc3b',
    secondaryColor: '#fff182',
    accentColor: '#b59218',
    label: 'Việc Quan Trọng',
  },
  redstone: {
    type: 'redstone',
    name: 'Quặng Redstone',
    xp: 160,
    primaryColor: '#ff2200',
    secondaryColor: '#ff7373',
    accentColor: '#990000',
    label: 'Backend & Logic',
  },
  diamond: {
    type: 'diamond',
    name: 'Quặng Kim Cương',
    xp: 220,
    primaryColor: '#4dedf4',
    secondaryColor: '#a8fcff',
    accentColor: '#1f9ea6',
    label: 'Ưu Tiên Cao',
  },
  emerald: {
    type: 'emerald',
    name: 'Quặng Lục Bảo',
    xp: 260,
    primaryColor: '#17dd62',
    secondaryColor: '#7cf6a5',
    accentColor: '#0a7d34',
    label: 'Cột Mốc Cốt Lõi',
  },
  netherite: {
    type: 'netherite',
    name: 'Khối Netherite',
    xp: 320,
    primaryColor: '#493f44',
    secondaryColor: '#6e5e65',
    accentColor: '#2a2226',
    label: 'Mục Tiêu Huyền Thoại',
  },
};

// 16x16 Pixel Art Stone Base Texture + Specks
export const PixelOreTexture: React.FC<{
  blockType: BlockRarity;
  size?: number;
  className?: string;
}> = ({ blockType, size = 64, className = '' }) => {
  const cfg = BLOCK_CONFIGS[blockType] || BLOCK_CONFIGS.diamond;

  if (blockType === 'netherite') {
    return (
      <svg
        viewBox="0 0 16 16"
        width={size}
        height={size}
        className={`select-none ${className}`}
        style={{ shapeRendering: 'crispEdges' }}
      >
        <rect width="16" height="16" fill="#312c30" />
        <rect x="0" y="0" width="16" height="1" fill="#4d444a" />
        <rect x="0" y="0" width="1" height="16" fill="#4d444a" />
        <rect x="15" y="0" width="1" height="16" fill="#1b171a" />
        <rect x="0" y="15" width="16" height="1" fill="#1b171a" />
        {/* Metal banding */}
        <rect x="2" y="2" width="12" height="12" fill="#3c353a" />
        <rect x="4" y="4" width="8" height="8" fill="#473e45" />
        <rect x="5" y="5" width="6" height="6" fill="#52484f" />
        <rect x="7" y="7" width="2" height="2" fill="#695d66" />
        <rect x="2" y="2" width="2" height="2" fill="#655b62" />
        <rect x="12" y="12" width="2" height="2" fill="#241e22" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={`select-none ${className}`}
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Stone background grid */}
      <rect width="16" height="16" fill="#696969" />
      <rect x="0" y="0" width="16" height="1" fill="#8a8a8a" />
      <rect x="0" y="0" width="1" height="16" fill="#8a8a8a" />
      <rect x="15" y="0" width="1" height="16" fill="#434343" />
      <rect x="0" y="15" width="16" height="1" fill="#434343" />

      {/* Stone shading details */}
      <rect x="2" y="3" width="3" height="2" fill="#595959" />
      <rect x="8" y="1" width="4" height="2" fill="#7a7a7a" />
      <rect x="12" y="8" width="3" height="3" fill="#595959" />
      <rect x="1" y="11" width="3" height="2" fill="#7a7a7a" />
      <rect x="6" y="12" width="4" height="2" fill="#505050" />

      {/* Ore Mineral Clusters */}
      {/* Cluster 1 (Top Left) */}
      <rect x="3" y="4" width="3" height="2" fill={cfg.primaryColor} />
      <rect x="4" y="3" width="2" height="1" fill={cfg.secondaryColor} />
      <rect x="2" y="5" width="2" height="2" fill={cfg.accentColor} />

      {/* Cluster 2 (Center Right) */}
      <rect x="9" y="5" width="4" height="3" fill={cfg.primaryColor} />
      <rect x="10" y="4" width="2" height="1" fill={cfg.secondaryColor} />
      <rect x="12" y="6" width="2" height="2" fill={cfg.accentColor} />
      <rect x="8" y="7" width="2" height="2" fill={cfg.secondaryColor} />

      {/* Cluster 3 (Bottom Left) */}
      <rect x="3" y="10" width="4" height="3" fill={cfg.primaryColor} />
      <rect x="4" y="10" width="2" height="1" fill={cfg.secondaryColor} />
      <rect x="2" y="12" width="2" height="2" fill={cfg.accentColor} />

      {/* Cluster 4 (Bottom Right) */}
      <rect x="10" y="11" width="3" height="3" fill={cfg.primaryColor} />
      <rect x="11" y="10" width="2" height="1" fill={cfg.secondaryColor} />
      <rect x="9" y="13" width="2" height="1" fill={cfg.accentColor} />
    </svg>
  );
};

// Mining Cracking Texture Stages (Stage 1 to 5)
export const PixelCrackOverlay: React.FC<{ stage: number; size?: number }> = ({ stage, size = 64 }) => {
  if (stage <= 0) return null;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className="absolute inset-0 pointer-events-none"
      style={{ shapeRendering: 'crispEdges' }}
    >
      {/* Stage 1 */}
      {stage >= 1 && (
        <path
          d="M7 4h2v2H7z M8 6h1v3H8z M6 8h2v1H6z"
          fill="#111111"
          opacity={0.85}
        />
      )}
      {/* Stage 2 */}
      {stage >= 2 && (
        <path
          d="M4 3h2v2H4z M9 9h3v1H9z M5 9h2v3H5z M10 4h2v2h-2z"
          fill="#111111"
          opacity={0.9}
        />
      )}
      {/* Stage 3 */}
      {stage >= 3 && (
        <path
          d="M2 6h3v1H2z M11 11h3v2h-3z M3 12h3v1H3z M12 3h2v3h-2z"
          fill="#111111"
          opacity={0.95}
        />
      )}
      {/* Stage 4 */}
      {stage >= 4 && (
        <path
          d="M0 7h4v2H0z M7 1h3v3H7z M12 7h4v3h-4z M7 12h4v3H7z"
          fill="#0a0a0a"
          opacity={0.95}
        />
      )}
      {/* Stage 5 */}
      {stage >= 5 && (
        <path
          d="M1 1h4v3H1z M11 1h4v3h-4z M1 11h4v4H1z M11 11h4v4h-4z M6 6h4v4H6z"
          fill="#000000"
          opacity={0.98}
        />
      )}
    </svg>
  );
};

// Drop Item Graphic (Rendered when Mined)
export const PixelDropItem: React.FC<{ blockType: BlockRarity; size?: number }> = ({
  blockType,
  size = 36,
}) => {
  const cfg = BLOCK_CONFIGS[blockType] || BLOCK_CONFIGS.diamond;

  if (blockType === 'diamond') {
    return (
      <svg viewBox="0 0 12 12" width={size} height={size} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 1h4v2H4z M2 3h8v2H2z M1 5h10v2H1z M2 7h8v2H2z M4 9h4v1H4z M5 10h2v1H5z" fill="#4dedf4" />
        <path d="M4 2h2v1H4z M3 4h2v1H3z M2 6h2v1H2z" fill="#ffffff" />
        <path d="M7 6h3v1H7z M6 8h2v1H6z" fill="#1a8794" />
      </svg>
    );
  }

  if (blockType === 'emerald') {
    return (
      <svg viewBox="0 0 12 12" width={size} height={size} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 1h4v2H4z M2 3h8v6H2z M4 9h4v2H4z" fill="#17dd62" />
        <path d="M4 2h2v2H4z M3 4h2v3H3z" fill="#a4f8be" />
        <path d="M7 5h2v4H7z M5 9h2v1H5z" fill="#0c6b2e" />
      </svg>
    );
  }

  if (blockType === 'gold' || blockType === 'iron' || blockType === 'netherite') {
    const isGold = blockType === 'gold';
    const isIron = blockType === 'iron';
    const main = isGold ? '#fcdc3b' : isIron ? '#d8d8d8' : '#493f44';
    const light = isGold ? '#fff494' : isIron ? '#ffffff' : '#73646c';
    const dark = isGold ? '#a6820d' : isIron ? '#8a8a8a' : '#231c20';

    return (
      <svg viewBox="0 0 14 10" width={size} height={size * 0.72} style={{ shapeRendering: 'crispEdges' }}>
        <rect x="2" y="1" width="10" height="2" fill={light} />
        <rect x="1" y="3" width="12" height="4" fill={main} />
        <rect x="2" y="7" width="10" height="2" fill={dark} />
      </svg>
    );
  }

  // Redstone Dust / Coal lump
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} style={{ shapeRendering: 'crispEdges' }}>
      <circle cx="6" cy="6" r="5" fill={cfg.primaryColor} />
      <circle cx="4" cy="4" r="2" fill={cfg.secondaryColor} />
    </svg>
  );
};

// Biome Visual Themes for World Cards (Vietnamese)
export const BIOME_CONFIGS: Record<
  BiomeType,
  {
    name: string;
    description: string;
    gradient: string;
    accentColor: string;
    badgeBg: string;
    iconSvg: string;
  }
> = {
  overworld: {
    name: 'Đồng Cỏ Overworld',
    description: 'Thảo nguyên xanh ngát, rừng sồi bạt ngàn và bầu trời trong lành.',
    gradient: 'from-emerald-950 via-teal-900 to-slate-900',
    accentColor: '#50c878',
    badgeBg: '#1b4d2e',
    iconSvg: '🌱',
  },
  diamond_cavern: {
    name: 'Hang Sâu Kim Cương',
    description: 'Hang đá sâu cổ đại lấp lánh những mạch quặng kim cương quý giá.',
    gradient: 'from-cyan-950 via-sky-950 to-slate-900',
    accentColor: '#4dedf4',
    badgeBg: '#123e4d',
    iconSvg: '💎',
  },
  nether: {
    name: 'Pháo Đài Nether',
    description: 'Lõi nham thạch rực lửa, nguy hiểm rình rập và thành trì đỏ thẫm.',
    gradient: 'from-red-950 via-rose-950 to-slate-900',
    accentColor: '#ff4d4d',
    badgeBg: '#4d1414',
    iconSvg: '🔥',
  },
  the_end: {
    name: 'Không Gian The End',
    description: 'Quần đảo lơ lửng giữa hư vô, tháp đá End Stone và truyền thuyết rồng.',
    gradient: 'from-purple-950 via-violet-950 to-slate-900',
    accentColor: '#c084fc',
    badgeBg: '#39124d',
    iconSvg: '🔮',
  },
  lush_caves: {
    name: 'Hang Động Rêu Xanh',
    description: 'Hoa bào tử rực rỡ, tán lá đỗ quyên và những hồ nước trong veo.',
    gradient: 'from-lime-950 via-emerald-950 to-slate-900',
    accentColor: '#a3e635',
    badgeBg: '#2f4211',
    iconSvg: '🌿',
  },
};
