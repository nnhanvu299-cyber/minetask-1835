import React from 'react';
import { UserId } from '../types';

interface AvatarProps {
  userId: UserId;
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export const PixelAvatar: React.FC<AvatarProps> = ({
  userId,
  size = 48,
  className = '',
  showBorder = true,
}) => {
  const renderFace = () => {
    switch (userId) {
      case 'steve':
        return (
          // Steve 8x8 Pixel Grid
          <svg viewBox="0 0 8 8" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
            {/* Hair */}
            <rect x="0" y="0" width="8" height="2" fill="#4a2e18" />
            <rect x="0" y="2" width="1" height="2" fill="#4a2e18" />
            <rect x="7" y="2" width="1" height="2" fill="#4a2e18" />
            {/* Skin */}
            <rect x="1" y="2" width="6" height="5" fill="#bd8b72" />
            <rect x="0" y="4" width="8" height="4" fill="#bd8b72" />
            {/* Eyes */}
            <rect x="1" y="3" width="1" height="1" fill="#ffffff" />
            <rect x="2" y="3" width="1" height="1" fill="#2d3a82" />
            <rect x="6" y="3" width="1" height="1" fill="#ffffff" />
            <rect x="5" y="3" width="1" height="1" fill="#2d3a82" />
            {/* Nose */}
            <rect x="3" y="4" width="2" height="1" fill="#9c6d57" />
            {/* Mouth / Beard */}
            <rect x="2" y="5" width="4" height="1" fill="#583424" />
            <rect x="3" y="6" width="2" height="1" fill="#4a2e18" />
          </svg>
        );

      case 'alex':
        return (
          // Alex 8x8 Pixel Grid
          <svg viewBox="0 0 8 8" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
            {/* Hair - Orange */}
            <rect x="0" y="0" width="8" height="2" fill="#bc5e24" />
            <rect x="0" y="2" width="2" height="3" fill="#bc5e24" />
            <rect x="6" y="2" width="2" height="2" fill="#bc5e24" />
            <rect x="0" y="5" width="1" height="3" fill="#a44e1a" />
            {/* Skin */}
            <rect x="2" y="2" width="4" height="5" fill="#e8b89d" />
            <rect x="1" y="4" width="6" height="4" fill="#e8b89d" />
            {/* Eyes - Emerald Green */}
            <rect x="2" y="3" width="1" height="1" fill="#ffffff" />
            <rect x="3" y="3" width="1" height="1" fill="#289456" />
            <rect x="6" y="3" width="1" height="1" fill="#ffffff" />
            <rect x="5" y="3" width="1" height="1" fill="#289456" />
            {/* Cheeks & Lips */}
            <rect x="1" y="4" width="1" height="1" fill="#df9b85" />
            <rect x="6" y="4" width="1" height="1" fill="#df9b85" />
            <rect x="3" y="5" width="2" height="1" fill="#b06456" />
          </svg>
        );

      case 'devon':
        return (
          // Devon (Creeper Dev with Cyber Tech Visor)
          <svg viewBox="0 0 8 8" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
            {/* Creeper Green Base */}
            <rect x="0" y="0" width="8" height="8" fill="#4da839" />
            <rect x="1" y="1" width="2" height="2" fill="#5db947" />
            <rect x="5" y="0" width="2" height="1" fill="#3b8629" />
            <rect x="0" y="6" width="2" height="2" fill="#3b8629" />
            <rect x="6" y="5" width="2" height="3" fill="#5db947" />
            {/* Cyber Visor / Coder Glasses (Redstone glow) */}
            <rect x="1" y="2" width="6" height="2" fill="#1b1d24" />
            <rect x="2" y="2" width="2" height="1" fill="#4dedf4" />
            <rect x="5" y="2" width="2" height="1" fill="#4dedf4" />
            {/* Creeper Mouth */}
            <rect x="3" y="4" width="2" height="2" fill="#151b14" />
            <rect x="2" y="5" width="1" height="3" fill="#151b14" />
            <rect x="5" y="5" width="1" height="3" fill="#151b14" />
            <rect x="3" y="6" width="2" height="1" fill="#151b14" />
          </svg>
        );

      case 'luna':
        return (
          // Luna (Netherite Knight / Purple Enderman Hunter)
          <svg viewBox="0 0 8 8" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
            {/* Netherite Helmet Base */}
            <rect x="0" y="0" width="8" height="8" fill="#2c252d" />
            <rect x="1" y="0" width="6" height="1" fill="#3f3741" />
            <rect x="0" y="1" width="1" height="4" fill="#3f3741" />
            <rect x="7" y="1" width="1" height="4" fill="#1e1820" />
            {/* Gold Trim */}
            <rect x="3" y="0" width="2" height="2" fill="#f1c40f" />
            {/* Visor Slit */}
            <rect x="1" y="3" width="6" height="2" fill="#0d0912" />
            {/* Glowing Amethyst Purple Eyes */}
            <rect x="2" y="3" width="1" height="1" fill="#c084fc" />
            <rect x="3" y="3" width="1" height="1" fill="#e879f9" />
            <rect x="5" y="3" width="1" height="1" fill="#c084fc" />
            <rect x="6" y="3" width="1" height="1" fill="#e879f9" />
            {/* Mouth guard */}
            <rect x="2" y="6" width="4" height="2" fill="#38303a" />
            <rect x="3" y="6" width="2" height="1" fill="#4a404c" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`inline-flex items-center justify-center select-none flex-shrink-0 ${
        showBorder ? 'mc-avatar-frame' : ''
      } ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
    >
      {renderFace()}
    </div>
  );
};
