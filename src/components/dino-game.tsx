"use client";

import * as React from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Trophy,
  Gamepad2,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Sounds using Web Audio API
class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  jump() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  score() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.setValueAtTime(988, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch {}
  }

  hit() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.25);
    } catch {}
  }
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "cactus_small" | "cactus_large" | "cactus_double" | "pterodactyl";
  animFrame?: number;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
}

export function DinoGame() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const soundRef = React.useRef(new SoundManager());

  // Game state
  const [gameState, setGameState] = React.useState<"IDLE" | "PLAYING" | "GAME_OVER">("IDLE");
  const [score, setScore] = React.useState(0);
  const [highScore, setHighScore] = React.useState(0);
  const [soundMuted, setSoundMuted] = React.useState(false);
  const [isNight, setIsNight] = React.useState(false);

  // Mutable game physics & elements in refs to avoid re-renders
  const gameRef = React.useRef({
    score: 0,
    highScore: 0,
    gameState: "IDLE" as "IDLE" | "PLAYING" | "GAME_OVER",
    speed: 6.5,
    distance: 0,
    groundY: 200,

    // Dino
    dino: {
      x: 40,
      y: 156,
      width: 44,
      height: 47,
      vy: 0,
      gravity: 0.62,
      isJumping: false,
      isDucking: false,
      animTimer: 0,
      animFrame: 0,
    },

    // Elements
    obstacles: [] as Obstacle[],
    obstacleTimer: 0,
    clouds: [] as Cloud[],
    stars: [] as Star[],
    groundOffset: 0,
    lastMilestone: 0,
    isNight: false,
  });

  // Load High Score from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("studyos_dino_hi_score");
      if (saved) {
        const val = parseInt(saved, 10) || 0;
        setHighScore(val);
        gameRef.current.highScore = val;
      }
    } catch {}
  }, []);

  // Keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        handleJump();
      } else if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        handleDuck(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        e.preventDefault();
        handleDuck(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleJump = () => {
    const g = gameRef.current;
    if (g.gameState === "IDLE" || g.gameState === "GAME_OVER") {
      restartGame();
      return;
    }
    if (g.gameState === "PLAYING" && !g.dino.isJumping) {
      g.dino.vy = -11.8;
      g.dino.isJumping = true;
      soundRef.current.jump();
    }
  };

  const handleDuck = (ducking: boolean) => {
    const g = gameRef.current;
    if (g.gameState !== "PLAYING") return;
    g.dino.isDucking = ducking;
    if (ducking && !g.dino.isJumping) {
      g.dino.height = 26;
      g.dino.width = 56;
      g.dino.y = g.groundY - 26;
    } else if (!ducking && !g.dino.isJumping) {
      g.dino.height = 47;
      g.dino.width = 44;
      g.dino.y = g.groundY - 47;
    }
  };

  const restartGame = () => {
    const g = gameRef.current;
    g.gameState = "PLAYING";
    g.score = 0;
    g.distance = 0;
    g.speed = 6.5;
    g.obstacles = [];
    g.obstacleTimer = 60;
    g.lastMilestone = 0;
    g.isNight = false;
    g.dino.y = g.groundY - 47;
    g.dino.vy = 0;
    g.dino.isJumping = false;
    g.dino.isDucking = false;
    g.dino.width = 44;
    g.dino.height = 47;

    setGameState("PLAYING");
    setScore(0);
    setIsNight(false);
    soundRef.current.jump();
  };

  // Main Canvas Render Loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    // Init clouds
    if (gameRef.current.clouds.length === 0) {
      for (let i = 0; i < 4; i++) {
        gameRef.current.clouds.push({
          x: 100 + i * 200 + Math.random() * 80,
          y: 35 + Math.random() * 50,
          speed: 0.8 + Math.random() * 0.5,
        });
      }
    }

    // Init stars
    if (gameRef.current.stars.length === 0) {
      for (let i = 0; i < 30; i++) {
        gameRef.current.stars.push({
          x: Math.random() * 800,
          y: Math.random() * 120,
          size: Math.random() > 0.6 ? 2 : 1,
        });
      }
    }

    const loop = () => {
      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Update Game Logic
      if (g.gameState === "PLAYING") {
        g.distance += g.speed * 0.15;
        const newScore = Math.floor(g.distance);
        if (newScore !== g.score) {
          g.score = newScore;
          setScore(newScore);

          // Milestone beep every 100 points
          if (newScore > 0 && newScore % 100 === 0 && newScore !== g.lastMilestone) {
            g.lastMilestone = newScore;
            soundRef.current.score();
          }

          // Day / Night cycle every 500 points
          const cycle = Math.floor(newScore / 400);
          const nightNow = cycle % 2 === 1;
          if (nightNow !== g.isNight) {
            g.isNight = nightNow;
            setIsNight(nightNow);
          }

          // Gradually increase speed
          if (g.speed < 13.5) {
            g.speed += 0.0015;
          }
        }

        // Dino Physics
        if (g.dino.isJumping) {
          g.dino.y += g.dino.vy;
          g.dino.vy += g.dino.gravity;

          const standingY = g.groundY - (g.dino.isDucking ? 26 : 47);
          if (g.dino.y >= standingY) {
            g.dino.y = standingY;
            g.dino.vy = 0;
            g.dino.isJumping = false;
          }
        }

        // Dino animation legs
        g.dino.animTimer++;
        if (g.dino.animTimer % 6 === 0) {
          g.dino.animFrame = (g.dino.animFrame + 1) % 2;
        }

        // Ground scroll
        g.groundOffset = (g.groundOffset + g.speed) % 24;

        // Clouds scroll
        g.clouds.forEach((c) => {
          c.x -= c.speed;
          if (c.x < -60) {
            c.x = width + 20 + Math.random() * 40;
            c.y = 35 + Math.random() * 50;
          }
        });

        // Obstacles generator
        g.obstacleTimer -= 1;
        if (g.obstacleTimer <= 0) {
          // Generate new obstacle
          const types: Obstacle["type"][] = ["cactus_small", "cactus_large", "cactus_double"];
          if (g.score > 250) {
            types.push("pterodactyl");
          }

          const picked = types[Math.floor(Math.random() * types.length)];
          let obsW = 20;
          let obsH = 40;
          let obsY = g.groundY - 40;

          if (picked === "cactus_small") {
            obsW = 16;
            obsH = 35;
            obsY = g.groundY - 35;
          } else if (picked === "cactus_large") {
            obsW = 24;
            obsH = 48;
            obsY = g.groundY - 48;
          } else if (picked === "cactus_double") {
            obsW = 36;
            obsH = 38;
            obsY = g.groundY - 38;
          } else if (picked === "pterodactyl") {
            obsW = 40;
            obsH = 28;
            // Pterodactyl fly heights: low (jump required) or high (duck required)
            const altitudes = [g.groundY - 32, g.groundY - 55];
            obsY = altitudes[Math.floor(Math.random() * altitudes.length)];
          }

          g.obstacles.push({
            x: width + 20,
            y: obsY,
            width: obsW,
            height: obsH,
            type: picked,
            animFrame: 0,
          });

          // Next spawn time varies by speed
          const minInterval = Math.max(45, Math.floor(100 - g.speed * 4));
          const maxInterval = Math.max(90, Math.floor(160 - g.speed * 5));
          g.obstacleTimer = minInterval + Math.floor(Math.random() * (maxInterval - minInterval));
        }

        // Move obstacles and check collisions
        for (let i = g.obstacles.length - 1; i >= 0; i--) {
          const obs = g.obstacles[i];
          obs.x -= g.speed;

          if (obs.type === "pterodactyl") {
            obs.animFrame = ((obs.animFrame || 0) + 0.15) % 2;
          }

          // Collision Detection (with forgiving 4px margin)
          const margin = 4;
          const dinoBox = {
            left: g.dino.x + margin,
            right: g.dino.x + g.dino.width - margin,
            top: g.dino.y + margin,
            bottom: g.dino.y + g.dino.height - margin,
          };
          const obsBox = {
            left: obs.x + margin,
            right: obs.x + obs.width - margin,
            top: obs.y + margin,
            bottom: obs.y + obs.height - margin,
          };

          const isColliding =
            dinoBox.left < obsBox.right &&
            dinoBox.right > obsBox.left &&
            dinoBox.top < obsBox.bottom &&
            dinoBox.bottom > obsBox.top;

          if (isColliding) {
            // Game over
            g.gameState = "GAME_OVER";
            setGameState("GAME_OVER");
            soundRef.current.hit();

            if (g.score > g.highScore) {
              g.highScore = g.score;
              setHighScore(g.score);
              try {
                localStorage.setItem("studyos_dino_hi_score", g.score.toString());
              } catch {}
            }
            break;
          }

          // Remove offscreen obstacles
          if (obs.x < -60) {
            g.obstacles.splice(i, 1);
          }
        }
      }

      // DRAWING
      ctx.save();

      // Clear & Background
      const isDarkMode = g.isNight;
      const bgColor = isDarkMode ? "#0F172A" : "#F8FAFC";
      const mainColor = isDarkMode ? "#E2E8F0" : "#334155";
      const secondaryColor = isDarkMode ? "#475569" : "#94A3B8";

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Stars in Night Mode
      if (isDarkMode) {
        ctx.fillStyle = "#94A3B8";
        g.stars.forEach((s) => {
          ctx.fillRect(s.x, s.y, s.size, s.size);
        });

        // Moon
        ctx.fillStyle = "#E2E8F0";
        ctx.beginPath();
        ctx.arc(720, 50, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(714, 46, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Clouds
      ctx.fillStyle = secondaryColor;
      g.clouds.forEach((c) => {
        drawCloud(ctx, c.x, c.y);
      });

      // Draw Horizon Ground Line
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, g.groundY);
      ctx.lineTo(width, g.groundY);
      ctx.stroke();

      // Ground texture dashes
      ctx.fillStyle = secondaryColor;
      for (let x = -g.groundOffset; x < width; x += 24) {
        const hash = (Math.sin(x * 12.3) * 10000) % 1;
        if (hash > 0.4) {
          ctx.fillRect(x + 4, g.groundY + 4, 8, 1.5);
        }
        if (hash > 0.7) {
          ctx.fillRect(x + 14, g.groundY + 8, 4, 1.5);
        }
      }

      // Draw Obstacles
      g.obstacles.forEach((obs) => {
        ctx.fillStyle = mainColor;
        if (obs.type === "cactus_small") {
          drawCactus(ctx, obs.x, obs.y, 16, 35);
        } else if (obs.type === "cactus_large") {
          drawCactus(ctx, obs.x, obs.y, 24, 48);
        } else if (obs.type === "cactus_double") {
          drawCactus(ctx, obs.x, obs.y + 4, 14, 34);
          drawCactus(ctx, obs.x + 16, obs.y, 18, 38);
        } else if (obs.type === "pterodactyl") {
          drawPterodactyl(ctx, obs.x, obs.y, Math.floor(obs.animFrame || 0));
        }
      });

      // Draw Dino
      drawDino(ctx, g.dino.x, g.dino.y, g.dino.width, g.dino.height, {
        isJumping: g.dino.isJumping,
        isDucking: g.dino.isDucking,
        legFrame: g.dino.animFrame,
        isDead: g.gameState === "GAME_OVER",
        color: mainColor,
      });

      // Score Display
      ctx.fillStyle = mainColor;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "right";

      const scoreStr = g.score.toString().padStart(5, "0");
      const hiStr = g.highScore.toString().padStart(5, "0");
      ctx.fillText(`HI ${hiStr}  ${scoreStr}`, width - 20, 28);

      // Start / Game Over text banner
      if (g.gameState === "IDLE") {
        ctx.textAlign = "center";
        ctx.font = "bold 14px sans-serif";
        ctx.fillStyle = mainColor;
        ctx.fillText("НАЖМИТЕ ПРОБЕЛ ИЛИ КЛИКНИТЕ ДЛЯ СТАРТА", width / 2, g.groundY - 70);
        ctx.font = "12px sans-serif";
        ctx.fillStyle = secondaryColor;
        ctx.fillText("Прыжок: Пробел / Стрелка вверх  •  Пригнуться: Стрелка вниз", width / 2, g.groundY - 46);
      } else if (g.gameState === "GAME_OVER") {
        ctx.textAlign = "center";
        ctx.font = "bold 18px monospace";
        ctx.fillStyle = mainColor;
        ctx.fillText("G A M E   O V E R", width / 2, g.groundY - 80);

        // Restart Icon button on canvas
        ctx.beginPath();
        ctx.arc(width / 2, g.groundY - 42, 18, 0, Math.PI * 2);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.font = "bold 15px sans-serif";
        ctx.fillText("↺", width / 2, g.groundY - 37);

        ctx.font = "12px sans-serif";
        ctx.fillStyle = secondaryColor;
        ctx.fillText("Нажмите пробел или кнопку для повтора", width / 2, g.groundY - 12);
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Назад в дашборд"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🦖</span>
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                StudyOS Offline Dino Runner
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                SECRET EASTER EGG
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Когда на паре выключили интернет или нужно отвлечься от лабораторных
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const next = !soundMuted;
              setSoundMuted(next);
              soundRef.current.enabled = !next;
            }}
            className="gap-1.5 text-xs h-9"
          >
            {soundMuted ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-primary" />}
            <span>{soundMuted ? "Без звука" : "Звук"}</span>
          </Button>

          <Button
            size="sm"
            onClick={restartGame}
            className="gap-1.5 text-xs h-9"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Заново</span>
          </Button>
        </div>
      </div>

      {/* Game Canvas Container */}
      <div
        ref={containerRef}
        onClick={handleJump}
        className="relative select-none cursor-pointer rounded-2xl border-2 border-border overflow-hidden bg-card shadow-xl transition-all"
        tabIndex={0}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={240}
          className="w-full h-auto block"
        />

        {/* Night mode indicator badge */}
        {isNight && (
          <div className="absolute top-3 left-4 text-[11px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-500/30">
            🌙 Ночная смена (Бонусная фаза)
          </div>
        )}
      </div>

      {/* Mobile Touch Controls & Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* On-screen controls for mobile */}
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-14 text-sm font-semibold gap-2 border-border bg-card/80 active:bg-primary active:text-primary-foreground"
            onPointerDown={(e) => {
              e.preventDefault();
              handleJump();
            }}
          >
            <ArrowUp className="h-5 w-5" />
            Прыжок (Space / ↑)
          </Button>

          <Button
            type="button"
            variant="outline"
            className="flex-1 h-14 text-sm font-semibold gap-2 border-border bg-card/80 active:bg-primary active:text-primary-foreground"
            onPointerDown={(e) => {
              e.preventDefault();
              handleDuck(true);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              handleDuck(false);
            }}
            onPointerLeave={() => handleDuck(false)}
          >
            <ArrowDown className="h-5 w-5" />
            Пригнуться (↓)
          </Button>
        </div>

        {/* High Score Card */}
        <div className="p-3.5 rounded-xl border border-border bg-card/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground uppercase font-mono">Рекорд группы</div>
              <div className="text-lg font-mono font-bold text-foreground">
                {highScore} <span className="text-xs font-normal text-muted-foreground">очков</span>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="text-xs text-primary hover:underline font-medium"
          >
            К учебе
          </Link>
        </div>
      </div>
    </div>
  );
}

// Pixel art drawing helpers
function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x + 14, y, 10, 0, Math.PI * 2);
  ctx.arc(x + 28, y - 4, 12, 0, Math.PI * 2);
  ctx.arc(x + 42, y, 9, 0, Math.PI * 2);
  ctx.rect(x + 8, y, 40, 8);
  ctx.fill();
}

function drawCactus(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  // Main stem
  const stemW = Math.max(6, Math.floor(w * 0.35));
  const stemX = x + Math.floor((w - stemW) / 2);
  ctx.fillRect(stemX, y, stemW, h);

  // Left arm
  const armH = Math.floor(h * 0.45);
  const armY = y + Math.floor(h * 0.25);
  ctx.fillRect(x, armY, stemX - x, 4);
  ctx.fillRect(x, armY - 8, 4, 12);

  // Right arm
  const rArmY = y + Math.floor(h * 0.35);
  ctx.fillRect(stemX + stemW, rArmY, x + w - (stemX + stemW), 4);
  ctx.fillRect(x + w - 4, rArmY - 8, 4, 12);
}

function drawPterodactyl(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  frame: number
) {
  // Body & Head
  ctx.fillRect(x + 10, y + 10, 24, 7);
  ctx.fillRect(x + 4, y + 8, 8, 5); // beak

  // Wings (frame 0 = down, frame 1 = up)
  if (frame === 0) {
    // Wing down
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 12);
    ctx.lineTo(x + 24, y + 26);
    ctx.lineTo(x + 28, y + 12);
    ctx.fill();
  } else {
    // Wing up
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 10);
    ctx.lineTo(x + 24, y - 4);
    ctx.lineTo(x + 28, y + 10);
    ctx.fill();
  }
}

function drawDino(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opt: {
    isJumping: boolean;
    isDucking: boolean;
    legFrame: number;
    isDead: boolean;
    color: string;
  }
) {
  ctx.fillStyle = opt.color;

  if (opt.isDucking) {
    // Ducking T-Rex (horizontal body)
    // Head extended forward
    ctx.fillRect(x + 36, y + 6, 20, 14);
    // Eye
    ctx.fillStyle = "#F8FAFC";
    ctx.fillRect(x + 46, y + 8, 3, 3);
    ctx.fillStyle = opt.color;

    // Body
    ctx.fillRect(x + 10, y + 10, 30, 12);
    // Tail
    ctx.fillRect(x, y + 12, 12, 6);

    // Legs
    if (opt.isJumping) {
      ctx.fillRect(x + 18, y + 22, 5, 4);
      ctx.fillRect(x + 28, y + 22, 5, 4);
    } else {
      if (opt.legFrame === 0) {
        ctx.fillRect(x + 16, y + 22, 5, 4);
        ctx.fillRect(x + 28, y + 20, 5, 4);
      } else {
        ctx.fillRect(x + 16, y + 20, 5, 4);
        ctx.fillRect(x + 28, y + 22, 5, 4);
      }
    }
  } else {
    // Standing T-Rex
    // Head & Snout
    ctx.fillRect(x + 22, y, 22, 17);
    ctx.fillRect(x + 24, y + 17, 10, 4); // lower jaw

    // Eye
    if (opt.isDead) {
      // X eye
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(x + 26, y + 4, 6, 6);
      ctx.fillStyle = opt.color;
      ctx.fillRect(x + 27, y + 5, 4, 4);
    } else {
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(x + 26, y + 4, 4, 4);
      ctx.fillStyle = opt.color;
    }

    // Body
    ctx.fillRect(x + 12, y + 16, 20, 20);

    // Tiny arm
    ctx.fillRect(x + 32, y + 24, 4, 4);

    // Tail
    ctx.fillRect(x + 4, y + 20, 10, 10);
    ctx.fillRect(x, y + 22, 6, 6);

    // Legs
    if (opt.isJumping || opt.isDead) {
      ctx.fillRect(x + 15, y + 36, 4, 11);
      ctx.fillRect(x + 15, y + 44, 7, 3);
      ctx.fillRect(x + 24, y + 36, 4, 11);
      ctx.fillRect(x + 24, y + 44, 7, 3);
    } else {
      if (opt.legFrame === 0) {
        // Left leg on ground, right lifted
        ctx.fillRect(x + 15, y + 36, 4, 11);
        ctx.fillRect(x + 15, y + 44, 7, 3);
        ctx.fillRect(x + 24, y + 36, 4, 6);
        ctx.fillRect(x + 26, y + 40, 4, 3);
      } else {
        // Right leg on ground, left lifted
        ctx.fillRect(x + 15, y + 36, 4, 6);
        ctx.fillRect(x + 17, y + 40, 4, 3);
        ctx.fillRect(x + 24, y + 36, 4, 11);
        ctx.fillRect(x + 24, y + 44, 7, 3);
      }
    }
  }
}
