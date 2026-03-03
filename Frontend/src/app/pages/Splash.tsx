import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LightRays from "../components/ui/LighRays";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/login"), 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen">
      {/* Fondo animado */}
      <div className="fixed inset-0 -z-10">
        <LightRays />
      </div>

      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-5xl font-bold text-teal-400 mb-4 animate-pulse">
          IT Support System
        </h1>
        <p className="text-teal-200 text-lg animate-pulse">Loading...</p>
      </div>
    </div>
  );
}