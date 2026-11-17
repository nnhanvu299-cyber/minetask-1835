import React, { useRef, useEffect, useState } from 'react';
import { soundEngine } from '../utils/audio';
import { Gamepad2, Play, RotateCcw, Trophy, X, Zap } from 'lucide-react';

interface ArcadeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArcadeModal: React.FC<ArcadeModalProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('minetask_1835_arcade_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game internal state ref so requestAnimationFrame always reads latest values
  const gameRef = useRef({
    birdY: 150,
    velocity: 0,
    gravity: 0.35,
    jumpPower: -6.5,
    pipes: [] as { x: number; top: number; bottom: number; passed: boolean }[],
    score: 0,
    frameCount: 0,
    state: 'idle' as 'idle' | 'playing' | 'gameover',
  });

  const jump = () => {
    if (gameRef.current.state === 'idle') {
      gameRef.current.state = 'playing';
      gameRef.current.birdY = 150;
      gameRef.current.velocity = gameRef.current.jumpPower;
      gameRef.current.pipes = [];
      gameRef.current.score = 0;
      setScore(0);
      setGameState('playing');
      soundEngine.playJump();
    } else if (gameRef.current.state === 'playing') {
      gameRef.current.velocity = gameRef.current.jumpPower;
      soundEngine.playJump();
    } else if (gameRef.current.state === 'gameover') {
      // Restart
      gameRef.current.state = 'playing';
      gameRef.current.birdY = 150;
      gameRef.current.velocity = gameRef.current.jumpPower;
      gameRef.current.pipes = [];
      gameRef.current.score = 0;
      setScore(0);
      setGameState('playing');
      soundEngine.playJump();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const canvasWidth = 360;
    const canvasHeight = 440;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const birdSize = 22;
    const pipeWidth = 52;
    const pipeGap = 125;
    const pipeSpeed = 2.2;

    const loop = () => {
      const g = gameRef.current;

      // 1. CLEAR & DRAW BACKGROUND (NỀN NGÀ #FDF7E7)
      ctx.fillStyle = '#FDF7E7';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Pixel Clouds
      ctx.fillStyle = '#E5D6B6';
      ctx.fillRect(40 + (g.frameCount * 0.2) % (canvasWidth + 60) - 40, 50, 48, 14);
      ctx.fillRect(180 + (g.frameCount * 0.15) % (canvasWidth + 60) - 40, 90, 60, 16);

      // 2. UPDATE GAME LOGIC IF PLAYING
      if (g.state === 'playing') {
        g.frameCount++;
        g.velocity += g.gravity;
        g.birdY += g.velocity;

        // Spawn pipes every 100 frames
        if (g.frameCount % 90 === 0) {
          const minPipe = 50;
          const maxPipe = canvasHeight - pipeGap - minPipe - 40;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe)) + minPipe;
          g.pipes.push({
            x: canvasWidth,
            top: topHeight,
            bottom: canvasHeight - topHeight - pipeGap - 30,
            passed: false,
          });
        }

        // Move pipes & collision detection
        for (let i = g.pipes.length - 1; i >= 0; i--) {
          const p = g.pipes[i];
          p.x -= pipeSpeed;

          // Check passed for score
          if (!p.passed && p.x + pipeWidth < 60) {
            p.passed = true;
            g.score += 1;
            setScore(g.score);
            soundEngine.playXpOrb(g.score);

            if (g.score > highScore) {
              setHighScore(g.score);
              localStorage.setItem('minetask_1835_arcade_highscore', g.score.toString());
            }
          }

          // Collision detection
          // Bird hitbox: x=60, y=birdY, w=birdSize, h=birdSize
          const birdX = 60;
          const birdY = g.birdY;

          // Top pipe collision
          if (
            birdX + birdSize > p.x &&
            birdX < p.x + pipeWidth &&
            birdY < p.top
          ) {
            g.state = 'gameover';
            setGameState('gameover');
            soundEngine.playGameOver();
          }

          // Bottom pipe collision
          if (
            birdX + birdSize > p.x &&
            birdX < p.x + pipeWidth &&
            birdY + birdSize > canvasHeight - 30 - p.bottom
          ) {
            g.state = 'gameover';
            setGameState('gameover');
            soundEngine.playGameOver();
          }

          // Remove offscreen pipes
          if (p.x + pipeWidth < -10) {
            g.pipes.splice(i, 1);
          }
        }

        // Ground collision & ceiling collision
        if (g.birdY + birdSize >= canvasHeight - 30) {
          g.birdY = canvasHeight - 30 - birdSize;
          g.state = 'gameover';
          setGameState('gameover');
          soundEngine.playGameOver();
        }
        if (g.birdY < 0) {
          g.birdY = 0;
          g.velocity = 0;
        }
      }

      // 3. DRAW PIPES (1835s PALETTE: PURPLE #753B94 -> BLUE #0072CE, CAP: MAGENTA #D10074)
      g.pipes.forEach((p) => {
        // Top Pipe
        ctx.fillStyle = '#753B94';
        ctx.fillRect(p.x, 0, pipeWidth, p.top);
        ctx.strokeStyle = '#2D1A11';
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, 0, pipeWidth, p.top);

        // Top Pipe Cap (Magenta #D10074)
        ctx.fillStyle = '#D10074';
        ctx.fillRect(p.x - 3, p.top - 16, pipeWidth + 6, 16);
        ctx.strokeRect(p.x - 3, p.top - 16, pipeWidth + 6, 16);

        // Bottom Pipe (Blue #0072CE)
        const bottomY = canvasHeight - 30 - p.bottom;
        ctx.fillStyle = '#0072CE';
        ctx.fillRect(p.x, bottomY, pipeWidth, p.bottom);
        ctx.strokeRect(p.x, bottomY, pipeWidth, p.bottom);

        // Bottom Pipe Cap (Magenta #D10074)
        ctx.fillStyle = '#D10074';
        ctx.fillRect(p.x - 3, bottomY, pipeWidth + 6, 16);
        ctx.strokeRect(p.x - 3, bottomY, pipeWidth + 6, 16);
      });

      // 4. DRAW GROUND (INK BROWN #2D1A11 WITH VOXEL GRASS TOP)
      ctx.fillStyle = '#2D1A11';
      ctx.fillRect(0, canvasHeight - 30, canvasWidth, 30);
      // Grass strip (1835s Orange / Gold)
      ctx.fillStyle = '#F37022';
      ctx.fillRect(0, canvasHeight - 30, canvasWidth, 6);
      ctx.fillStyle = '#ED1B24';
      for (let x = 0; x < canvasWidth; x += 16) {
        ctx.fillRect(x, canvasHeight - 24, 8, 4);
      }

      // 5. DRAW BIRD / MINER (1835s ORANGE #F37022 & RED #ED1B24)
      const bx = 60;
      const by = g.birdY;

      ctx.save();
      ctx.translate(bx + birdSize / 2, by + birdSize / 2);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (g.velocity * 4 * Math.PI) / 180));
      ctx.rotate(angle);

      // Body (Orange #F37022)
      ctx.fillStyle = '#F37022';
      ctx.fillRect(-birdSize / 2, -birdSize / 2, birdSize, birdSize);
      ctx.strokeStyle = '#2D1A11';
      ctx.lineWidth = 2;
      ctx.strokeRect(-birdSize / 2, -birdSize / 2, birdSize, birdSize);

      // Wing (Red #ED1B24)
      ctx.fillStyle = '#ED1B24';
      ctx.fillRect(-birdSize / 2 + 2, -birdSize / 2 + 6, 9, 8);

      // Eye
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(birdSize / 2 - 8, -birdSize / 2 + 3, 6, 6);
      ctx.fillStyle = '#2D1A11';
      ctx.fillRect(birdSize / 2 - 5, -birdSize / 2 + 5, 3, 3);

      // Beak / Pickaxe
      ctx.fillStyle = '#facc15';
      ctx.fillRect(birdSize / 2, -birdSize / 2 + 6, 6, 5);

      ctx.restore();

      // 6. DRAW SCORE BANNER
      ctx.fillStyle = '#2D1A11';
      ctx.font = 'bold 22px Minecraft, "Minecraft F2D V1", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ĐIỂM: ${g.score}`, canvasWidth / 2, 34);

      // 7. OVERLAY FOR IDLE OR GAMEOVER
      if (g.state === 'idle') {
        ctx.fillStyle = 'rgba(45, 26, 17, 0.65)';
        ctx.fillRect(20, 130, canvasWidth - 40, 150);
        ctx.fillStyle = '#FAF2DC';
        ctx.strokeStyle = '#F37022';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 130, canvasWidth - 40, 150);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Minecraft, "Minecraft F2D V1", monospace';
        ctx.fillText('TRẠM GIẢI TRÍ 1835s', canvasWidth / 2, 170);

        ctx.font = '13px Montserrat, sans-serif';
        ctx.fillStyle = '#FAF2DC';
        ctx.fillText('Bấm nút Nhảy hoặc Phím Space', canvasWidth / 2, 205);
        ctx.fillText('để bay né chướng ngại vật!', canvasWidth / 2, 225);

        ctx.fillStyle = '#F37022';
        ctx.font = 'bold 14px Montserrat, sans-serif';
        ctx.fillText('▶ BẤM ĐÂY ĐỂ BẮT ĐẦU', canvasWidth / 2, 255);
      } else if (g.state === 'gameover') {
        ctx.fillStyle = 'rgba(45, 26, 17, 0.75)';
        ctx.fillRect(20, 120, canvasWidth - 40, 170);
        ctx.strokeStyle = '#ED1B24';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, 120, canvasWidth - 40, 170);

        ctx.fillStyle = '#ED1B24';
        ctx.font = 'bold 24px Minecraft, "Minecraft F2D V1", monospace';
        ctx.fillText('GAME OVER!', canvasWidth / 2, 160);

        ctx.font = '14px Montserrat, sans-serif';
        ctx.fillStyle = '#FAF2DC';
        ctx.fillText(`Điểm trận này: ${g.score}`, canvasWidth / 2, 195);
        ctx.fillStyle = '#facc15';
        ctx.fillText(`Kỷ lục tốt nhất: ${Math.max(g.score, highScore)}`, canvasWidth / 2, 220);

        ctx.fillStyle = '#F37022';
        ctx.font = 'bold 13px Montserrat, sans-serif';
        ctx.fillText('🔄 BẤM ĐỂ CHƠI LẠI', canvasWidth / 2, 258);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, highScore]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-black/75 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      {/* 8-bit Pixel Arcade Cabinet */}
      <div
        className="mc-panel w-full max-w-md bg-[#FAF2DC] text-[#2D1A11] border-4 border-[#2D1A11] shadow-[8px_8px_0px_#2D1A11] overflow-hidden flex flex-col max-h-[96vh] max-h-[96dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Arcade Marquee Header */}
        <div className="bg-gradient-to-r from-[#F37022] via-[#ED1B24] to-[#0072CE] p-3 text-white border-b-4 border-[#2D1A11] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 size={22} className="stroke-[2.5]" />
            <div>
              <h2 className="text-base font-bold tracking-wider leading-none">
                TRẠM GIẢI TRÍ 1835s ARCADE
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="mc-btn mc-btn-obsidian px-2.5 py-1 text-xs text-white"
            title="Đóng arcade"
          >
            <X size={15} />
          </button>
        </div>

        {/* Score & Trophy Bar */}
        <div className="bg-[#EFE4CA] px-4 py-2 border-b-2 border-[#2D1A11] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#2D1A11]">
            <Zap size={14} className="text-[#F37022]" />
            <span>ĐIỂM HIỆN TẠI: <strong className="text-base text-[#F37022]">{score}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 font-bold text-[#2D1A11]">
            <Trophy size={14} className="text-[#facc15]" />
            <span>KỶ LỤC: <strong className="text-base text-[#0072CE]">{highScore}</strong></span>
          </div>
        </div>

        {/* Game Canvas Container */}
        <div className="p-3 bg-[#2D1A11] flex items-center justify-center cursor-pointer select-none" onClick={jump}>
          <canvas
            ref={canvasRef}
            className="border-3 border-[#FAF2DC] shadow-inner max-w-full h-auto block"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Arcade Control Deck */}
        <div className="p-3 bg-[#EFE4CA] border-t-3 border-[#2D1A11] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={jump}
            className="flex-1 mc-btn mc-btn-1835 py-3 text-sm font-bold tracking-wider flex items-center justify-center gap-2 shadow-md active:translate-y-1"
          >
            <Play size={16} />
            <span>{gameState === 'gameover' ? 'CHƠI LẠI' : 'NHẢY'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              gameRef.current.state = 'idle';
              gameRef.current.birdY = 150;
              gameRef.current.pipes = [];
              gameRef.current.score = 0;
              setScore(0);
              setGameState('idle');
            }}
            className="mc-btn mc-btn-obsidian px-3 py-3 text-xs font-bold text-[#FAF2DC]"
            title="Khởi động lại từ đầu"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
