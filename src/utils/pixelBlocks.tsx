import React from 'react';
import { BlockConfig, BlockRarity, BiomeType } from '../types';

export const BLOCK_CONFIGS: Record<BlockRarity, BlockConfig> = {
  gold: {
    type: 'gold',
    name: 'Đào Vàng',
    xp: 140,
    primaryColor: '#fcdc3b',
    secondaryColor: '#fff799',
    accentColor: '#b58c0c',
    label: 'Kho Báu Vàng',
  },
  diamond: {
    type: 'diamond',
    name: 'Đào Kim Cương',
    xp: 220,
    primaryColor: '#4dedf4',
    secondaryColor: '#ffffff',
    accentColor: '#0e7490',
    label: 'Kho Báu Kim Cương',
  },
  emerald: {
    type: 'emerald',
    name: 'Đào Lục Bảo',
    xp: 260,
    primaryColor: '#10b981',
    secondaryColor: '#a7f3d0',
    accentColor: '#047857',
    label: 'Ngọc Lục Bảo Quý',
  },
  netherite: {
    type: 'netherite',
    name: 'Đào Netherite',
    xp: 320,
    primaryColor: '#493f44',
    secondaryColor: '#8f7e88',
    accentColor: '#241e22',
    label: 'Netherite Cực Phẩm',
  },
  iron: {
    type: 'iron',
    name: 'Đào Sắt',
    xp: 80,
    primaryColor: '#d4d4d8',
    secondaryColor: '#ffffff',
    accentColor: '#71717a',
    label: 'Sắt Thỏi',
  },
  redstone: {
    type: 'redstone',
    name: 'Đào Đá Đỏ',
    xp: 160,
    primaryColor: '#ef4444',
    secondaryColor: '#fca5a5',
    accentColor: '#991b1b',
    label: 'Đá Đỏ (Redstone)',
  },
  coal: {
    type: 'coal',
    name: 'Đào Than Đá',
    xp: 40,
    primaryColor: '#27272a',
    secondaryColor: '#52525b',
    accentColor: '#09090b',
    label: 'Than Nhanh',
  },
  lapis: {
    type: 'lapis',
    name: 'Đào Ngọc Lam',
    xp: 180,
    primaryColor: '#2563eb',
    secondaryColor: '#93c5fd',
    accentColor: '#1e3a8a',
    label: 'Ngọc Lam (Lapis)',
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

// Drop Item Graphic (Rendered when Mined or Selected)
export const PixelDropItem: React.FC<{ blockType: BlockRarity; size?: number; className?: string }> = ({
  blockType,
  size = 36,
  className = '',
}) => {
  if (blockType === 'gold') {
    return (
      <svg viewBox="0 0 16 12" width={size} height={size * 0.75} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <rect x="1" y="2" width="14" height="9" fill="#8c6d05" />
        <rect x="2" y="1" width="12" height="1" fill="#bfa010" />
        <rect x="2" y="3" width="12" height="6" fill="#fcdc3b" />
        <rect x="3" y="2" width="10" height="2" fill="#fff799" />
        <rect x="4" y="2" width="4" height="1" fill="#ffffff" />
        <rect x="2" y="8" width="12" height="2" fill="#b58c0c" />
        <rect x="2" y="10" width="12" height="1" fill="#6d5402" />
      </svg>
    );
  }

  if (blockType === 'diamond') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 1h6v2H4z M2 3h10v3H2z M1 6h12v2H1z M2 8h10v2H2z M4 10h6v2H4z M5 12h4v1H5z" fill="#0891b2" />
        <path d="M5 2h4v1H5z M3 3h8v2H3z M2 5h10v2H2z M3 7h8v2H3z M5 9h4v2H5z M6 11h2v1H6z" fill="#22d3ee" />
        <path d="M5 2h2v1H5z M3 3h3v2H3z M2 5h3v2H2z" fill="#ffffff" />
        <path d="M8 5h4v2H8z M7 7h4v2H7z M6 9h3v1H6z" fill="#0e7490" />
      </svg>
    );
  }

  if (blockType === 'emerald') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M4 1h6v2H4z M2 3h10v8H2z M4 11h6v2H4z" fill="#065f46" />
        <path d="M4 2h6v2H4z M3 4h8v6H3z M4 10h6v2H4z" fill="#10b981" />
        <path d="M4 2h3v2H4z M3 4h3v3H3z" fill="#a7f3d0" />
        <path d="M8 6h3v4H8z M6 10h3v1H6z" fill="#047857" />
      </svg>
    );
  }

  if (blockType === 'netherite') {
    return (
      <svg viewBox="0 0 16 12" width={size} height={size * 0.75} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <rect x="1" y="2" width="14" height="9" fill="#181417" />
        <rect x="2" y="1" width="12" height="1" fill="#493f44" />
        <rect x="2" y="3" width="12" height="6" fill="#3a3237" />
        <rect x="3" y="2" width="10" height="2" fill="#5c5057" />
        <rect x="4" y="2" width="4" height="1" fill="#8f7e88" />
        <rect x="2" y="8" width="12" height="2" fill="#272124" />
        <rect x="2" y="10" width="12" height="1" fill="#141012" />
      </svg>
    );
  }

  if (blockType === 'iron') {
    return (
      <svg viewBox="0 0 16 12" width={size} height={size * 0.75} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <rect x="1" y="2" width="14" height="9" fill="#52525b" />
        <rect x="2" y="1" width="12" height="1" fill="#a1a1aa" />
        <rect x="2" y="3" width="12" height="6" fill="#d4d4d8" />
        <rect x="3" y="2" width="10" height="2" fill="#f4f4f5" />
        <rect x="4" y="2" width="4" height="1" fill="#ffffff" />
        <rect x="2" y="8" width="12" height="2" fill="#a1a1aa" />
        <rect x="2" y="10" width="12" height="1" fill="#3f3f46" />
      </svg>
    );
  }

  if (blockType === 'redstone') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M5 1h4v2H5z M3 3h8v2H3z M2 5h10v4H2z M3 9h8v2H3z M5 11h4v2H5z" fill="#7f1d1d" />
        <path d="M5 2h4v1H5z M3 4h8v2H3z M3 6h8v2H3z M4 8h6v2H4z M5 10h4v1H5z" fill="#ef4444" />
        <path d="M5 3h2v1H5z M4 4h2v2H4z" fill="#fca5a5" />
        <path d="M7 6h3v3H7z" fill="#991b1b" />
      </svg>
    );
  }

  if (blockType === 'lapis') {
    return (
      <svg viewBox="0 0 14 14" width={size} height={size} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
        <path d="M3 2h8v2H3z M2 4h10v6H2z M3 10h8v2H3z" fill="#1e3a8a" />
        <path d="M4 3h6v2H4z M3 5h8v4H3z M4 9h6v2H4z" fill="#2563eb" />
        <path d="M4 3h2v2H4z M3 5h2v2H3z" fill="#93c5fd" />
        <path d="M7 6h3v3H7z" fill="#1d4ed8" />
        <rect x="8" y="4" width="2" height="2" fill="#facc15" />
      </svg>
    );
  }

  // Coal
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} className={`select-none ${className}`} style={{ shapeRendering: 'crispEdges' }}>
      <path d="M3 2h8v2H3z M2 4h10v6H2z M4 10h6v2H4z" fill="#09090b" />
      <path d="M4 3h6v2H4z M3 5h8v4H3z M4 9h5v1H4z" fill="#27272a" />
      <path d="M4 4h3v2H4z" fill="#52525b" />
      <path d="M7 7h3v2H7z" fill="#18181b" />
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
