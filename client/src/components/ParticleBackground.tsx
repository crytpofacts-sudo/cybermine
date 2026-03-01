/*
 * CyberMine Particle Background — Neon Metropolis Design
 * Lightweight CSS-based floating particles for ambient effect
 */
import { useMemo } from "react";

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

export default function ParticleBackground() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 10,
      color: Math.random() > 0.7 ? "#ff0066" : "#00f0ff",
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.15,
            animation: `particle-float ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes particle-float {
          0% { transform: translateY(0) translateX(0); opacity: 0.1; }
          50% { opacity: 0.25; }
          100% { transform: translateY(-80px) translateX(30px); opacity: 0.05; }
        }
      `}</style>
    </div>
  );
}
