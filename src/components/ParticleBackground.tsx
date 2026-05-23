import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

interface ParticleBackgroundProps {
  darkMode: boolean;
}

export function ParticleBackground({ darkMode }: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const colors = darkMode
      ? ["rgba(79, 70, 229, 0.3)", "rgba(147, 51, 234, 0.3)", "rgba(37, 99, 235, 0.2)"]
      : ["rgba(168, 85, 247, 0.15)", "rgba(6, 182, 212, 0.15)", "rgba(244, 63, 94, 0.15)"];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 18000), 75);
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 2.5 + 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = p.radius * 2;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0; // reset shadow

        // Connect nearby particles
        for (let j = idx + 1; j < particles.length; j++) {
          const other = particles[j];
          const dist = Math.hypot(p.x - other.x, p.y - other.y);
          if (dist < 110) {
            const alpha = (1 - dist / 110) * 0.12;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = darkMode
              ? `rgba(255, 255, 255, ${alpha})`
              : `rgba(0, 0, 0, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      id="particles-canvas"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}
