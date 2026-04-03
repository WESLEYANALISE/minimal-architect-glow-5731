import { useRef, useEffect, useCallback } from "react";
import type { PowerUpType } from "./InvasoresPowerUps";

interface Artigo {
  numero: string;
  texto: string;
}

type GhostType = 'normal' | 'elite' | 'boss';

interface Ghost {
  x: number;
  y: number;
  width: number;
  height: number;
  artigo: Artigo;
  speed: number;
  ghostType: GhostType;
  hp: number;
  maxHp: number;
  zigzagPhase: number;
  zigzagSpeed: number;
  zigzagAmplitude: number;
  direction: number;
  spawnTime: number;
  lastBossShot: number;
}

interface Projectile {
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number; // For triple shot
}

interface BossProjectile {
  x: number;
  y: number;
  radius: number;
  speed: number;
  artigo: Artigo;
  ghostType: GhostType;
  phase: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size?: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  layer: number;
}

interface Props {
  artigos: Artigo[];
  nivel: number;
  paused: boolean;
  onGhostReachedBottom: (artigo: Artigo, ghostType: GhostType) => void;
  onGhostDestroyed: (ghostType: GhostType) => void;
  activePowerUp?: PowerUpType | null;
}

// ========== DRAW FUNCTIONS (pure canvas, no emojis) ==========

const drawNormalGhost = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, age: number) => {
  const r = size * 0.4;
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.3, r, Math.PI, 0, false);
  ctx.lineTo(cx + r, cy + r * 0.7);
  const waves = 4;
  for (let i = waves; i >= 0; i--) {
    const wx = cx + r - (i * 2 * r) / waves;
    const wy = cy + r * 0.7 + Math.sin(age * 5 + i * 1.5) * r * 0.15;
    ctx.lineTo(wx, wy);
  }
  ctx.closePath();
  ctx.fill();

  // Cyan pulsing trail particles (enhanced)
  ctx.globalAlpha = 0.15 + Math.sin(age * 4) * 0.1;
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.5, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.35, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.3, cy - r * 0.35, r * 0.18, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.08, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy - r * 0.3, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
};

const drawEliteGhost = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, age: number) => {
  const r = size * 0.42;

  // Purple orbiting energy particles
  for (let i = 0; i < 3; i++) {
    const angle = age * 3 + (i * Math.PI * 2) / 3;
    const ox = cx + Math.cos(angle) * r * 1.2;
    const oy = cy + Math.sin(angle) * r * 0.8;
    ctx.globalAlpha = 0.5 + Math.sin(age * 5 + i) * 0.3;
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(ox, oy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.25, r, Math.PI, 0, false);
  ctx.lineTo(cx + r, cy + r * 0.7);
  const waves = 5;
  for (let i = waves; i >= 0; i--) {
    const wx = cx + r - (i * 2 * r) / waves;
    const wy = cy + r * 0.7 + Math.sin(age * 6 + i * 1.2) * r * 0.18;
    ctx.lineTo(wx, wy);
  }
  ctx.closePath();
  ctx.fill();

  // Small horns
  ctx.fillStyle = '#7c3aed';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.5, cy - r * 0.7);
  ctx.lineTo(cx - r * 0.35, cy - r * 1.1);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.5, cy - r * 0.7);
  ctx.lineTo(cx + r * 0.35, cy - r * 1.1);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.6);
  ctx.closePath();
  ctx.fill();

  // Angry eyes
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.3, r * 0.18, r * 0.15, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.3, cy - r * 0.3, r * 0.18, r * 0.15, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.06, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.28, cy - r * 0.28, r * 0.06, 0, Math.PI * 2);
  ctx.fill();
};

const drawBossGhost = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, age: number) => {
  const r = size * 0.45;

  // Pulsating fire aura
  const auraPulse = 0.8 + Math.sin(age * 3) * 0.3;
  ctx.globalAlpha = 0.15 * auraPulse;
  const auraGrad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.8);
  auraGrad.addColorStop(0, '#f97316');
  auraGrad.addColorStop(0.5, '#ef4444');
  auraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.8 * auraPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Body
  const grad = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.1);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.6, '#ef4444');
  grad.addColorStop(1, '#991b1b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.2, r, Math.PI, 0, false);
  ctx.lineTo(cx + r, cy + r * 0.8);
  const waves = 6;
  for (let i = waves; i >= 0; i--) {
    const wx = cx + r - (i * 2 * r) / waves;
    const wy = cy + r * 0.8 + Math.sin(age * 4 + i) * r * 0.2;
    ctx.lineTo(wx, wy);
  }
  ctx.closePath();
  ctx.fill();

  // Big horns
  ctx.fillStyle = '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.6, cy - r * 0.6);
  ctx.lineTo(cx - r * 0.45, cy - r * 1.3);
  ctx.lineTo(cx - r * 0.15, cy - r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.6, cy - r * 0.6);
  ctx.lineTo(cx + r * 0.45, cy - r * 1.3);
  ctx.lineTo(cx + r * 0.15, cy - r * 0.5);
  ctx.closePath();
  ctx.fill();

  // Glowing eyes
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, cy - r * 0.25, r * 0.2, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + r * 0.3, cy - r * 0.25, r * 0.2, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.23, r * 0.07, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.3, cy - r * 0.23, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.15, r * 0.3, 0.1, Math.PI - 0.1);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    const tx = cx - r * 0.2 + i * r * 0.2;
    ctx.fillRect(tx, cy + r * 0.12, r * 0.08, r * 0.12);
  }
};

// ========== COMPONENT ==========

const InvasoresCanvas = ({ artigos, nivel, paused, onGhostReachedBottom, onGhostDestroyed, activePowerUp }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePowerUpRef = useRef(activePowerUp);
  
  useEffect(() => {
    activePowerUpRef.current = activePowerUp;
  }, [activePowerUp]);

  const gameStateRef = useRef({
    shipX: 0,
    shipWidth: 60,
    shipHeight: 30,
    ghosts: [] as Ghost[],
    projectiles: [] as Projectile[],
    bossProjectiles: [] as BossProjectile[],
    particles: [] as Particle[],
    stars: [] as Star[],
    lastSpawn: 0,
    artigoIndex: 0,
    animFrameId: 0,
    touching: false,
    touchX: 0,
    lastShot: 0,
    autoShootInterval: null as any,
    ghostsSpawned: 0,
    shipFlash: 0,
    bombFlash: 0,
  });

  const getConfig = useCallback(() => {
    const configs = [
      { speed: 1, maxGhosts: 2, spawnInterval: 3000 },
      { speed: 1.3, maxGhosts: 3, spawnInterval: 2500 },
      { speed: 1.6, maxGhosts: 4, spawnInterval: 2000 },
      { speed: 2, maxGhosts: 5, spawnInterval: 1500 },
      { speed: 2.5, maxGhosts: 6, spawnInterval: 1000 },
    ];
    return configs[Math.min(nivel - 1, configs.length - 1)];
  }, [nivel]);

  // Handle bomb power-up
  useEffect(() => {
    if (activePowerUp === 'bomb') {
      const gs = gameStateRef.current;
      // Destroy all ghosts
      gs.ghosts.forEach(g => {
        // Add explosion for each
        const colorMap: Record<GhostType, string[]> = {
          normal: ['#06b6d4', '#22d3ee', '#67e8f9', '#fff'],
          elite: ['#a855f7', '#c084fc', '#e9d5ff', '#fff'],
          boss: ['#ef4444', '#f97316', '#fbbf24', '#fff'],
        };
        const colors = colorMap[g.ghostType];
        for (let i = 0; i < 20; i++) {
          const angle = (Math.PI * 2 * i) / 20;
          const force = 3 + Math.random() * 5;
          gs.particles.push({
            x: g.x + g.width / 2, y: g.y + g.height / 2,
            vx: Math.cos(angle) * force,
            vy: Math.sin(angle) * force,
            life: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 4,
          });
        }
        onGhostDestroyed(g.ghostType);
      });
      gs.ghosts = [];
      gs.bossProjectiles = [];
      gs.bombFlash = Date.now();
    }
  }, [activePowerUp, onGhostDestroyed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      gameStateRef.current.shipX = canvas.width / 2 - gameStateRef.current.shipWidth / 2;
    };
    resize();
    window.addEventListener("resize", resize);

    const gs = gameStateRef.current;
    if (gs.stars.length === 0) {
      for (let i = 0; i < 60; i++) {
        gs.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.3,
          speed: Math.random() * 0.3 + 0.05,
          brightness: Math.random(),
          layer: 0,
        });
      }
      for (let i = 0; i < 40; i++) {
        gs.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2.5 + 1,
          speed: Math.random() * 0.8 + 0.3,
          brightness: Math.random(),
          layer: 1,
        });
      }
    }

    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gameStateRef.current;

    const shoot = () => {
      const now = Date.now();
      if (now - gs.lastShot < 300) return;
      gs.lastShot = now;

      if (activePowerUpRef.current === 'triple_shot') {
        // Triple shot: 3 projectiles in a fan
        const angles = [-0.25, 0, 0.25];
        angles.forEach(angle => {
          gs.projectiles.push({
            x: gs.shipX + gs.shipWidth / 2 - 3,
            y: canvas.height - gs.shipHeight - 15,
            width: 6,
            height: 14,
            angle,
          });
        });
      } else {
        gs.projectiles.push({
          x: gs.shipX + gs.shipWidth / 2 - 3,
          y: canvas.height - gs.shipHeight - 15,
          width: 6,
          height: 14,
          angle: 0,
        });
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (paused) return;
      if (e.key === "ArrowLeft") gs.shipX = Math.max(0, gs.shipX - 20);
      if (e.key === "ArrowRight") gs.shipX = Math.min(canvas.width - gs.shipWidth, gs.shipX + 20);
      if (e.key === " ") { e.preventDefault(); shoot(); }
    };
    window.addEventListener("keydown", onKeyDown);

    const onTouchStart = (e: TouchEvent) => {
      if (paused) return;
      e.preventDefault();
      gs.touching = true;
      gs.touchX = e.touches[0].clientX;
      shoot();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (paused || !gs.touching) return;
      e.preventDefault();
      const newX = e.touches[0].clientX;
      const delta = newX - gs.touchX;
      gs.shipX = Math.max(0, Math.min(canvas.width - gs.shipWidth, gs.shipX + delta));
      gs.touchX = newX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      gs.touching = false;
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    const onMouseMove = (e: MouseEvent) => {
      if (paused) return;
      const rect = canvas.getBoundingClientRect();
      gs.shipX = Math.max(0, Math.min(canvas.width - gs.shipWidth, e.clientX - rect.left - gs.shipWidth / 2));
    };
    const onClick = () => { if (!paused) shoot(); };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    const autoShoot = setInterval(() => {
      if (gs.touching && !paused) shoot();
    }, 350);
    gs.autoShootInterval = autoShoot;

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
      clearInterval(autoShoot);
    };
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gs = gameStateRef.current;
    let running = true;

    const determineGhostType = (spawnCount: number): GhostType => {
      if (spawnCount % 12 === 0 && spawnCount > 0) return 'boss';
      if (spawnCount % 5 === 0 && spawnCount > 0) return 'elite';
      return 'normal';
    };

    const spawnGhost = () => {
      const config = getConfig();
      if (gs.ghosts.length >= config.maxGhosts) return;
      if (artigos.length === 0) return;

      const artigo = artigos[gs.artigoIndex % artigos.length];
      gs.artigoIndex++;
      gs.ghostsSpawned++;

      const ghostType = determineGhostType(gs.ghostsSpawned);

      let w: number, h: number, hp: number, zigzagSpeed: number, zigzagAmplitude: number, speed: number;

      switch (ghostType) {
        case 'boss':
          w = 80; h = 80; hp = 10;
          zigzagSpeed = 0.1 + nivel * 0.01;
          zigzagAmplitude = 4 + nivel * 0.5;
          speed = (0.35 + Math.random() * 0.15) * config.speed;
          break;
        case 'elite':
          w = 65; h = 65; hp = 5;
          zigzagSpeed = 0.06 + nivel * 0.005;
          zigzagAmplitude = 2.5 + nivel * 0.3;
          speed = (0.45 + Math.random() * 0.2) * config.speed;
          break;
        default:
          w = 55; h = 55; hp = 3;
          zigzagSpeed = 0.03 + nivel * 0.003;
          zigzagAmplitude = 1 + nivel * 0.15;
          speed = (0.5 + Math.random() * 0.3) * config.speed;
      }

      gs.ghosts.push({
        x: Math.random() * (canvas.width - w - 20) + 10,
        y: -h,
        width: w, height: h,
        artigo, speed, ghostType, hp, maxHp: hp,
        zigzagPhase: Math.random() * Math.PI * 2,
        zigzagSpeed, zigzagAmplitude,
        direction: Math.random() > 0.5 ? 1 : -1,
        spawnTime: Date.now(),
        lastBossShot: Date.now(),
      });
    };

    const addExplosion = (x: number, y: number, ghostType: GhostType) => {
      const colorMap: Record<GhostType, string[]> = {
        normal: ['#06b6d4', '#22d3ee', '#67e8f9', '#fff'],
        elite: ['#a855f7', '#c084fc', '#e9d5ff', '#fff'],
        boss: ['#ef4444', '#f97316', '#fbbf24', '#fff'],
      };
      const colors = colorMap[ghostType];
      const count = ghostType === 'boss' ? 30 : ghostType === 'elite' ? 20 : 14;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const force = 2 + Math.random() * (ghostType === 'boss' ? 7 : ghostType === 'elite' ? 5 : 3);
        gs.particles.push({
          x, y,
          vx: Math.cos(angle) * force,
          vy: Math.sin(angle) * force,
          life: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: ghostType === 'boss' ? 4 : 3,
        });
      }
    };

    const drawGhostEntity = (ctx: CanvasRenderingContext2D, g: Ghost, timestamp: number) => {
      const age = (timestamp - g.spawnTime) / 1000;
      const breathScale = 1 + Math.sin(age * 2.5) * (g.ghostType === 'boss' ? 0.08 : g.ghostType === 'elite' ? 0.06 : 0.04);
      const wobble = Math.sin(age * 3) * (g.ghostType === 'boss' ? 0.12 : g.ghostType === 'elite' ? 0.08 : 0.05);

      ctx.save();
      const cx = g.x + g.width / 2;
      const cy = g.y + g.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(wobble);
      ctx.scale(breathScale, breathScale);
      ctx.translate(-cx, -cy);

      const glowPulse = 0.6 + Math.sin(age * 4) * 0.4;
      const glowConfigs: Record<GhostType, { color: string; blur: number }> = {
        normal: { color: '#06b6d4', blur: 12 * glowPulse },
        elite: { color: '#a855f7', blur: 16 * glowPulse },
        boss: { color: '#ef4444', blur: 22 * glowPulse },
      };
      const glow = glowConfigs[g.ghostType];
      ctx.shadowColor = glow.color;
      ctx.shadowBlur = glow.blur;

      switch (g.ghostType) {
        case 'boss': drawBossGhost(ctx, cx, cy, g.width, age); break;
        case 'elite': drawEliteGhost(ctx, cx, cy, g.width, age); break;
        default: drawNormalGhost(ctx, cx, cy, g.width, age);
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      // HP bar
      const barW = g.width * 0.8;
      const barH = 5;
      const barX = g.x + (g.width - barW) / 2;
      const barY = g.y + g.height * 0.82;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX, barY, barW, barH);
      const hpRatio = g.hp / g.maxHp;
      const hpColor = g.ghostType === 'boss'
        ? (hpRatio > 0.5 ? '#ef4444' : '#fbbf24')
        : g.ghostType === 'elite'
          ? (hpRatio > 0.5 ? '#a855f7' : '#c084fc')
          : (hpRatio > 0.5 ? '#06b6d4' : '#22d3ee');
      ctx.fillStyle = hpColor;
      ctx.fillRect(barX, barY, barW * hpRatio, barH);

      // Article badge
      const badgeColors: Record<GhostType, string> = {
        normal: 'rgba(6, 182, 212, 0.85)',
        elite: 'rgba(168, 85, 247, 0.85)',
        boss: 'rgba(239, 68, 68, 0.9)',
      };
      ctx.fillStyle = badgeColors[g.ghostType];
      const label = `Art.${g.artigo.numero}`;
      ctx.font = g.ghostType === 'boss' ? 'bold 11px sans-serif' : 'bold 10px sans-serif';
      const badgeW = Math.max(ctx.measureText(label).width + 10, 40);
      const badgeX = g.x + g.width / 2 - badgeW / 2;
      const badgeY = g.y + g.height * 0.9;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, g.x + g.width / 2, badgeY + 8);
    };

    const gameLoop = (timestamp: number) => {
      if (!running) return;
      if (paused) {
        gs.animFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Bomb flash effect
      const bombAge = Date.now() - gs.bombFlash;
      if (bombAge < 300) {
        ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - bombAge / 300)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw parallax stars
      gs.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
        const alpha = star.layer === 0 ? 0.3 + star.brightness * 0.3 : 0.5 + star.brightness * 0.5;
        const b = Math.floor(alpha * 255);
        ctx.fillStyle = star.layer === 0 ? `rgba(${b},${b},${b + 30},${alpha})` : `rgba(${b + 20},${b + 20},${b + 50},1)`;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });

      // Spawn ghosts
      const config = getConfig();
      if (timestamp - gs.lastSpawn > config.spawnInterval) {
        spawnGhost();
        gs.lastSpawn = timestamp;
      }

      const now = Date.now();

      // Update & draw ghosts
      for (let i = gs.ghosts.length - 1; i >= 0; i--) {
        const g = gs.ghosts[i];
        g.y += g.speed;
        g.zigzagPhase += g.zigzagSpeed;
        const zigzagX = Math.sin(g.zigzagPhase) * g.zigzagAmplitude * g.direction;
        g.x += zigzagX;
        g.x = Math.max(5, Math.min(canvas.width - g.width - 5, g.x));

        if (g.y + g.height >= canvas.height - gs.shipHeight - 10) {
          const type = g.ghostType;
          gs.ghosts.splice(i, 1);
          onGhostReachedBottom(g.artigo, type);
          return;
        }

        // Boss shoots
        if (g.ghostType === 'boss' && now - g.lastBossShot > 2000 + Math.random() * 1000) {
          g.lastBossShot = now;
          gs.bossProjectiles.push({
            x: g.x + g.width / 2,
            y: g.y + g.height,
            radius: 8,
            speed: 2.5 + nivel * 0.2,
            artigo: g.artigo,
            ghostType: 'boss',
            phase: Math.random() * Math.PI * 2,
          });
        }

        // Trail particles for ghosts
        if (Math.random() > 0.7) {
          const trailColors: Record<GhostType, string> = {
            normal: '#06b6d4',
            elite: '#a855f7',
            boss: '#ef4444',
          };
          gs.particles.push({
            x: g.x + g.width / 2 + (Math.random() - 0.5) * g.width * 0.4,
            y: g.y + g.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 0.5 + 0.2,
            life: 0.4 + Math.random() * 0.3,
            color: trailColors[g.ghostType],
            size: 2,
          });
        }

        drawGhostEntity(ctx, g, timestamp);
      }

      // Update & draw boss projectiles
      const shipY = canvas.height - gs.shipHeight - 75;
      for (let i = gs.bossProjectiles.length - 1; i >= 0; i--) {
        const bp = gs.bossProjectiles[i];
        bp.y += bp.speed;
        bp.phase += 0.15;

        if (bp.y > canvas.height + 20) {
          gs.bossProjectiles.splice(i, 1);
          continue;
        }

        const shipCx = gs.shipX + gs.shipWidth / 2;
        const shipCy = shipY + gs.shipHeight / 2;
        const dx = bp.x - shipCx;
        const dy = bp.y - shipCy;
        if (Math.sqrt(dx * dx + dy * dy) < bp.radius + gs.shipWidth * 0.35) {
          gs.bossProjectiles.splice(i, 1);
          gs.shipFlash = now;
          for (let p = 0; p < 15; p++) {
            const angle = (Math.PI * 2 * p) / 15;
            gs.particles.push({
              x: shipCx, y: shipCy,
              vx: Math.cos(angle) * (2 + Math.random() * 3),
              vy: Math.sin(angle) * (2 + Math.random() * 3),
              life: 0.8,
              color: ['#ef4444', '#f97316', '#fff'][Math.floor(Math.random() * 3)],
              size: 3,
            });
          }
          onGhostReachedBottom(bp.artigo, bp.ghostType);
          return;
        }

        ctx.save();
        const fireGrad = ctx.createRadialGradient(bp.x, bp.y, 0, bp.x, bp.y, bp.radius * 2);
        fireGrad.addColorStop(0, 'rgba(255,200,50,0.9)');
        fireGrad.addColorStop(0.4, 'rgba(239,68,68,0.7)');
        fireGrad.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = fireGrad;
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.radius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // Update & draw player projectiles
      for (let i = gs.projectiles.length - 1; i >= 0; i--) {
        const p = gs.projectiles[i];
        const angle = p.angle || 0;
        p.y -= 7 * Math.cos(angle);
        p.x += 7 * Math.sin(angle);
        if (p.y < -p.height || p.x < -10 || p.x > canvas.width + 10) {
          gs.projectiles.splice(i, 1);
          continue;
        }

        // Trail
        if (Math.random() > 0.4) {
          gs.particles.push({
            x: p.x + p.width / 2 + (Math.random() - 0.5) * 4,
            y: p.y + p.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: Math.random() * 1.5,
            life: 0.3 + Math.random() * 0.2,
            color: ['#22d3ee', '#06b6d4', '#67e8f9'][Math.floor(Math.random() * 3)],
            size: 2,
          });
        }

        let hit = false;
        for (let j = gs.ghosts.length - 1; j >= 0; j--) {
          const g = gs.ghosts[j];
          if (p.x < g.x + g.width && p.x + p.width > g.x && p.y < g.y + g.height && p.y + p.height > g.y) {
            g.hp--;
            gs.projectiles.splice(i, 1);
            if (g.hp <= 0) {
              addExplosion(g.x + g.width / 2, g.y + g.height / 2, g.ghostType);
              gs.ghosts.splice(j, 1);
              onGhostDestroyed(g.ghostType);
            } else {
              const sparkColor = g.ghostType === 'boss' ? '#fbbf24' : g.ghostType === 'elite' ? '#c084fc' : '#67e8f9';
              for (let s = 0; s < 4; s++) {
                gs.particles.push({
                  x: p.x + p.width / 2, y: p.y,
                  vx: (Math.random() - 0.5) * 5,
                  vy: -Math.random() * 3,
                  life: 0.5,
                  color: sparkColor,
                  size: 2,
                });
              }
            }
            hit = true;
            break;
          }
        }
        if (hit) continue;

        ctx.fillStyle = '#22d3ee';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.shadowBlur = 0;
      }

      // Update & draw particles
      for (let i = gs.particles.length - 1; i >= 0; i--) {
        const pt = gs.particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= 0.03;
        if (pt.life <= 0) { gs.particles.splice(i, 1); continue; }
        ctx.globalAlpha = pt.life;
        ctx.fillStyle = pt.color;
        const sz = pt.size || 3;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, sz * pt.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Draw ship
      const flashAge = now - gs.shipFlash;
      const isFlashing = flashAge < 400;
      ctx.save();
      if (isFlashing) {
        ctx.globalAlpha = 0.5 + Math.sin(flashAge * 0.03) * 0.5;
      }
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fillStyle = isFlashing ? '#fff' : '#0e7490';
      ctx.beginPath();
      ctx.moveTo(gs.shipX + gs.shipWidth / 2, shipY);
      ctx.lineTo(gs.shipX + gs.shipWidth, shipY + gs.shipHeight);
      ctx.lineTo(gs.shipX, shipY + gs.shipHeight);
      ctx.closePath();
      ctx.fill();
      if (!isFlashing) {
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(gs.shipX + gs.shipWidth / 2, shipY + 5);
        ctx.lineTo(gs.shipX + gs.shipWidth / 2 + 8, shipY + gs.shipHeight - 5);
        ctx.lineTo(gs.shipX + gs.shipWidth / 2 - 8, shipY + gs.shipHeight - 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(gs.shipX + gs.shipWidth / 2, shipY + gs.shipHeight + 2, 4 + Math.sin(timestamp * 0.01) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();

      gs.animFrameId = requestAnimationFrame(gameLoop);
    };

    gs.animFrameId = requestAnimationFrame(gameLoop);

    return () => {
      running = false;
      cancelAnimationFrame(gs.animFrameId);
    };
  }, [paused, artigos, nivel, getConfig, onGhostReachedBottom, onGhostDestroyed]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block touch-none"
      style={{ background: 'linear-gradient(180deg, #020617 0%, #0c1222 50%, #0f172a 100%)' }}
    />
  );
};

export default InvasoresCanvas;
