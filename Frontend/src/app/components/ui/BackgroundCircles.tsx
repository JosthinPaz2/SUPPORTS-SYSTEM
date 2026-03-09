import React from 'react';

export const BackgroundCircles: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute w-80 h-80 bg-yellow-400 rounded-full -top-20 -left-10 opacity-80"></div>
      <div className="absolute w-[500px] h-[500px] bg-green-500 rounded-full top-10 right-[-150px] opacity-80"></div>
      <div className="absolute w-[450px] h-[450px] bg-cyan-500/80 rounded-full bottom-40 left-10 opacity-80"></div>
      <div className="absolute w-72 h-72 bg-pink-400/80 rounded-full bottom-10 left-[-40px] opacity-80"></div>
      <div className="absolute w-60 h-60 bg-yellow-400 rounded-full bottom-[-80px] right-40 opacity-80"></div>
      <div className="absolute w-40 h-40 bg-red-500 rounded-full bottom-112 right-65 opacity-80"></div>
      <div className="absolute w-10 h-10 bg-black rounded-full top-1/3 left-1/2 opacity-80"></div>
      <div className="absolute w-24 h-24 bg-teal-700 rounded-full top-1/2 left-10 opacity-80"></div>
    </div>
  );
};

export default BackgroundCircles;