
import React from "react";

export const BackgroundCircles: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-slate-900">

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(100%) translateX(-40px) scale(0.8) rotate(0deg);
            opacity: 0;
          }

          20% { opacity: 0.9; }

          50% {
            transform: translateY(40%) translateX(40px) scale(1.1) rotate(6deg);
          }

          80% { opacity: 0.9; }

          100% {
            transform: translateY(-20%) translateX(-20px) scale(1.4) rotate(12deg);
            opacity: 0;
          }
        }

        @keyframes morph {
          0%,100% { border-radius: 60% 40% 50% 50% / 40% 50% 60% 50%; }
          25% { border-radius: 40% 60% 30% 70% / 60% 40% 70% 30%; }
          50% { border-radius: 70% 30% 60% 40% / 30% 70% 40% 60%; }
          75% { border-radius: 30% 70% 40% 60% / 50% 40% 60% 50%; }
        }

        .lava-bubble {
          animation: floatUp 18s infinite ease-in-out, morph 12s infinite alternate;
          filter: blur(50px);
          mix-blend-mode: screen;
        }

        .lava-bubble-slow {
          animation: floatUp 26s infinite ease-in-out, morph 18s infinite alternate-reverse;
          filter: blur(70px);
          mix-blend-mode: screen;
        }

        .lava-bubble-fast {
          animation: floatUp 14s infinite ease-in-out, morph 8s infinite alternate;
          filter: blur(35px);
          mix-blend-mode: screen;
        }
      `}</style>


      {/* Glow central plasma */}
      <div className="absolute inset-0 
        bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.25),transparent_70%)]
        blur-3xl pointer-events-none"></div>


      {/* Capa base burbujas grandes */}
      <div className="absolute inset-0">

        <div className="absolute w-96 h-96 rounded-full bg-teal-400/30 lava-bubble-slow -bottom-32 left-1/4"></div>

        <div className="absolute w-80 h-80 rounded-full bg-cyan-400/30 lava-bubble-slow -bottom-40 right-1/3"></div>

        <div className="absolute w-72 h-72 rounded-full bg-emerald-400/30 lava-bubble-slow -bottom-24 left-1/2"></div>

      </div>


      {/* Capa media */}
      <div className="absolute inset-0">

        <div className="absolute w-64 h-64 rounded-full bg-cyan-300/40 lava-bubble -bottom-20 left-10"></div>

        <div className="absolute w-56 h-56 rounded-full bg-teal-300/40 lava-bubble -bottom-32 right-20"></div>

        <div className="absolute w-48 h-48 rounded-full bg-blue-300/40 lava-bubble -bottom-16 left-1/3"></div>

        <div className="absolute w-52 h-52 rounded-full bg-cyan-400/40 lava-bubble -bottom-40 left-2/3"></div>

      </div>


      {/* Burbujas pequeñas */}
      <div className="absolute inset-0">

        <div className="absolute w-40 h-40 rounded-full bg-teal-200/50 lava-bubble-fast -bottom-12 left-1/4"></div>

        <div className="absolute w-36 h-36 rounded-full bg-cyan-200/50 lava-bubble-fast -bottom-24 right-1/4"></div>

        <div className="absolute w-32 h-32 rounded-full bg-emerald-200/50 lava-bubble-fast -bottom-16 left-2/3"></div>

        <div className="absolute w-28 h-28 rounded-full bg-blue-200/50 lava-bubble-fast -bottom-36 left-1/5"></div>

        <div className="absolute w-24 h-24 rounded-full bg-cyan-300/50 lava-bubble-fast -bottom-8 right-1/5"></div>

      </div>


      {/* brillo superior */}
      <div className="absolute inset-0 
        bg-gradient-to-t 
        from-teal-500/20 
        via-transparent 
        to-cyan-400/10 
        blur-2xl pointer-events-none"></div>

    </div>
  );
};

export default BackgroundCircles;