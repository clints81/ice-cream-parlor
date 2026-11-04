import { useEffect, useRef } from 'react';

// A one-shot confetti burst on a canvas. Respects prefers-reduced-motion
// by drawing a still sprinkle of stars instead of animating.

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const COLORS = ['#ff6f91', '#ffd166', '#3cc8a7', '#5aa9f0', '#9b6bd1', '#ff9f43'];

export default function Confetti({ count = 140 }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    if (prefersReducedMotion()) {
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath();
        ctx.arc(Math.random() * W, Math.random() * H * 0.6, 3 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      return undefined;
    }

    const parts = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 80,
      y: H * 0.35,
      vx: (Math.random() - 0.5) * 11,
      vy: -6 - Math.random() * 9,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
    let raf;
    let frames = 0;
    const tick = () => {
      frames++;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.vy += 0.25;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (frames < 260) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count]);
  return <canvas ref={ref} className="confetti" aria-hidden="true" />;
}
