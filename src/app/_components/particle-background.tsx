"use client";

import { useEffect, useRef, useState } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const syncTheme = () => {
      setTheme(root.dataset.workspaceTheme === "dark" ? "dark" : "light");
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-workspacetheme"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particlesRef.current = buildParticles(canvas.width, canvas.height);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 180;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 0.12;
          particle.vy -= Math.sin(angle) * force * 0.12;
        }

        particle.vx += (particle.originalX - particle.x) * 0.009;
        particle.vy += (particle.originalY - particle.y) * 0.009;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.97;
        particle.vy *= 0.97;

        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = particle.color;
        context.fill();
      });

      const lineColor =
        theme === "dark" ? "rgba(56, 189, 248, 0.08)" : "rgba(14, 165, 233, 0.08)";

      for (let index = 0; index < particlesRef.current.length; index += 1) {
        const current = particlesRef.current[index];

        for (let nextIndex = index + 1; nextIndex < particlesRef.current.length; nextIndex += 1) {
          const next = particlesRef.current[nextIndex];
          const distance = Math.hypot(current.x - next.x, current.y - next.y);

          if (distance > 120) {
            continue;
          }

          context.beginPath();
          context.moveTo(current.x, current.y);
          context.lineTo(next.x, next.y);
          context.strokeStyle = lineColor;
          context.lineWidth = 1;
          context.stroke();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-80" />;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  originalX: number;
  originalY: number;
};

function buildParticles(width: number, height: number): Particle[] {
  const particleCount = width < 768 ? 22 : 40;
  const palette = ["rgba(34, 211, 238, 0.35)", "rgba(37, 99, 235, 0.24)", "rgba(16, 185, 129, 0.2)"];

  return Array.from({ length: particleCount }, () => {
    const x = Math.random() * width;
    const y = Math.random() * height;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2.4 + 1.2,
      color: palette[Math.floor(Math.random() * palette.length)],
      originalX: x,
      originalY: y,
    };
  });
}
