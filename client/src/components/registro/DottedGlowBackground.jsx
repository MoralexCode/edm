import { useEffect, useRef } from 'react';

const DottedGlowBackground = ({
  className = '',
  gap = 32,
  radius = 1.2,
  color = 'rgba(255, 255, 255, 0.03)',
  glowColor = 'rgba(99, 102, 241, 0.4)',
  speedScale = 0.4,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = canvasRef.current;
    const container = containerRef.current;
    if (!el || !container) return undefined;

    const ctx = el.getContext('2d');
    if (!ctx) return undefined;

    let raf = 0;
    let stopped = false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let dots = [];

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      el.width = Math.max(1, Math.floor(width * dpr));
      el.height = Math.max(1, Math.floor(height * dpr));
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots = [];
      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          dots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: (0.5 + Math.random()) * speedScale,
          });
        }
      }
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    const draw = (time) => {
      if (stopped) return;
      const { width, height } = container.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);

      dots.forEach((dot) => {
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.001 * dot.speed + dot.phase));
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (pulse > 0.75) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, radius * 3, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, radius * 3);
          grad.addColorStop(0, glowColor);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fill();
        }
      });

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [gap, radius, color, glowColor, speedScale]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
};

export default DottedGlowBackground;
