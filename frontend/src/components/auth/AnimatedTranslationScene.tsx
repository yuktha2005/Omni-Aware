import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  text: string;
  lang: string;
  alpha: number;
  baseAlpha: number;
  color: string;
}

const MULTILINGUAL_WORDS = [
  { text: "नमस्ते", lang: "Hindi", color: "#f59e0b" },
  { text: "வணக்கம்", lang: "Tamil", color: "#06b6d4" },
  { text: "హలో", lang: "Telugu", color: "#8b5cf6" },
  { text: "হ্যালো", lang: "Bengali", color: "#10b981" },
  { text: "Hello", lang: "English", color: "#6366f1" },
  { text: "नमस्कार", lang: "Marathi", color: "#ec4899" },
  { text: "નમસ્તે", lang: "Gujarati", color: "#f97316" },
  { text: "ਸਤਿ ਸ਼੍ਰੀ", lang: "Punjabi", color: "#eab308" },
  { text: "നമസ്കാരം", lang: "Malayalam", color: "#14b8a6" },
  { text: "ನಮಸ್ಕಾರ", lang: "Kannada", color: "#3b82f6" },
  { text: "سلام", lang: "Urdu", color: "#a855f7" },
  { text: "ନମସ୍କାର", lang: "Odia", color: "#64748b" },
  { text: "Bonjour", lang: "French", color: "#60a5fa" },
  { text: "Hola", lang: "Spanish", color: "#f43f5e" },
  { text: "こんにちは", lang: "Japanese", color: "#ec4899" },
  { text: "Public Alert", lang: "EN", color: "#4f46e5" },
  { text: "जन सूचना", lang: "HI", color: "#f59e0b" },
  { text: "விழிப்புணர்வு", lang: "TA", color: "#06b6d4" },
  { text: "చైతన్యం", lang: "TE", color: "#8b5cf6" },
  { text: "সচেতনতা", lang: "BN", color: "#10b981" },
  { text: "जागरूकता", lang: "MR", color: "#f43f5e" },
];

const GLYPHS = [
  { char: "अ", top: "12%", left: "8%", size: "text-6xl", color: "text-amber-500/20", anim: "animate-drift-1" },
  { char: "அ", top: "72%", left: "12%", size: "text-7xl", color: "text-cyan-500/20", anim: "animate-drift-2" },
  { char: "A", top: "18%", left: "86%", size: "text-8xl", color: "text-indigo-500/20", anim: "animate-drift-3" },
  { char: "అ", top: "78%", left: "82%", size: "text-6xl", color: "text-purple-500/20", anim: "animate-drift-4" },
  { char: "অ", top: "45%", left: "5%", size: "text-5xl", color: "text-emerald-500/20", anim: "animate-drift-1" },
  { char: "ಕ", top: "35%", left: "92%", size: "text-6xl", color: "text-rose-500/20", anim: "animate-drift-2" },
  { char: "അ", top: "85%", left: "46%", size: "text-5xl", color: "text-teal-500/20", anim: "animate-drift-3" },
  { char: "文", top: "8%", left: "54%", size: "text-5xl", color: "text-indigo-400/20", anim: "animate-drift-4" },
];

export const AnimatedTranslationScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, radius: 140 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Initialize particles
    const particleCount = Math.min(Math.floor((width * height) / 32000), 42);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const item = MULTILINGUAL_WORDS[i % MULTILINGUAL_WORDS.length];
      const baseAlpha = 0.4 + Math.random() * 0.45;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        size: 11 + Math.random() * 4,
        text: item.text,
        lang: item.lang,
        alpha: baseAlpha,
        baseAlpha: baseAlpha,
        color: item.color,
      });
    }

    let pulseTick = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      pulseTick += 0.02;

      // Draw connections between nearby language nodes (simulating translation graph)
      const maxDistance = 140;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.22;
            const gradient = ctx.createLinearGradient(
              particles[i].x,
              particles[i].y,
              particles[j].x,
              particles[j].y
            );
            gradient.addColorStop(0, `${particles[i].color}${Math.floor(lineAlpha * 255).toString(16).padStart(2, "0")}`);
            gradient.addColorStop(1, `${particles[j].color}${Math.floor(lineAlpha * 255).toString(16).padStart(2, "0")}`);

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Animated pulse packets travelling along the edge
            if (dist < 110) {
              const packetPos = (Math.sin(pulseTick + i + j) + 1) / 2;
              const px = particles[i].x + (particles[j].x - particles[i].x) * packetPos;
              const py = particles[i].y + (particles[j].y - particles[i].y) * packetPos;
              
              ctx.beginPath();
              ctx.arc(px, py, 1.8, 0, Math.PI * 2);
              ctx.fillStyle = "#818cf8";
              ctx.fill();
            }
          }
        }
      }

      // Update and draw each word node
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 30 || p.x > width - 30) p.vx *= -1;
        if (p.y < 30 || p.y > height - 30) p.vy *= -1;

        // Mouse avoidance/repulsion
        const mdx = p.x - mouseRef.current.x;
        const mdy = p.y - mouseRef.current.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < mouseRef.current.radius) {
          const force = (mouseRef.current.radius - mdist) / mouseRef.current.radius;
          p.x += (mdx / mdist) * force * 2.5;
          p.y += (mdy / mdist) * force * 2.5;
          p.alpha = Math.min(1, p.baseAlpha + 0.35);
        } else {
          p.alpha = p.baseAlpha + Math.sin(pulseTick + idx) * 0.12;
        }

        // Draw node aura halo
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();

        // Draw Multilingual Text
        ctx.font = `600 ${p.size}px 'Inter', sans-serif`;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.95;
        ctx.fillText(p.text, p.x + 8, p.y + 4);

        // Language tag pill
        ctx.font = `700 8px 'Inter', sans-serif`;
        ctx.fillStyle = "#94a3b8";
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.fillText(`[${p.lang}]`, p.x + 8, p.y + 14);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Dynamic Ambient Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-[#0a1128] to-slate-950 opacity-95" />
      
      {/* Animated Translation Laser Beam */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-laser-scan pointer-events-none" />

      {/* Cyber Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
          backgroundSize: "44px 44px",
        }}
      />

      {/* 3D Floating Script Glyphs Watermarks */}
      {GLYPHS.map((g, i) => (
        <div
          key={i}
          className={`absolute font-bold select-none ${g.size} ${g.color} ${g.anim} transition-transform duration-1000`}
          style={{ top: g.top, left: g.left }}
        >
          {g.char}
        </div>
      ))}

      {/* Neural Graph Interactive HTML5 Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* Floating Floating Glassmorphism Translation Badges */}
      <div className="hidden xl:block">
        {/* Top Left Floating Badge */}
        <div className="absolute top-8 left-8 flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-slate-900/70 p-3.5 backdrop-blur-md shadow-2xl shadow-indigo-950/60 animate-drift-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/30">
            🌐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                Neural Translation Engine
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              22 Constitutional Languages • 98.4% BLEU Score
            </p>
          </div>
        </div>

        {/* Bottom Left Floating Badge */}
        <div className="absolute bottom-8 left-8 flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-3.5 backdrop-blur-md shadow-2xl shadow-cyan-950/60 animate-drift-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white shadow-md shadow-cyan-500/30">
            🛡️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                AI Fact Verification Gate
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              Source Grounding & Misinformation Shield
            </p>
          </div>
        </div>

        {/* Top Right Floating Badge */}
        <div className="absolute top-8 right-8 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-slate-900/70 p-3.5 backdrop-blur-md shadow-2xl shadow-amber-950/60 animate-drift-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-rose-500 text-white shadow-md shadow-amber-500/30">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                Multi-Channel Relay
              </span>
            </div>
            <p className="text-xs font-bold text-white mt-0.5">
              SMS • WhatsApp • Voice IVR • Web Push
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTranslationScene;
