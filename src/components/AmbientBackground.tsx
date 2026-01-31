import { memo } from 'react';

function AmbientBackgroundComponent() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Floating Pink Coins - Gumroad style */}
      <div 
        className="absolute w-32 h-32 md:w-48 md:h-48 animate-float opacity-80"
        style={{ top: '10%', left: '-5%' }}
      >
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center shadow-glow-pink transform rotate-[-15deg]">
          <span className="text-4xl md:text-6xl font-black text-primary-foreground">SR</span>
        </div>
      </div>

      <div 
        className="absolute w-24 h-24 md:w-36 md:h-36 animate-float-slow opacity-80"
        style={{ top: '5%', right: '5%' }}
      >
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center shadow-glow-pink transform rotate-[10deg]">
          <span className="text-3xl md:text-5xl font-black text-primary-foreground">SR</span>
        </div>
      </div>

      <div 
        className="absolute w-20 h-20 md:w-32 md:h-32 animate-float-reverse opacity-70"
        style={{ top: '25%', right: '-3%' }}
      >
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center shadow-glow-pink transform rotate-[25deg]">
          <span className="text-2xl md:text-4xl font-black text-primary-foreground">SR</span>
        </div>
      </div>

      <div 
        className="absolute w-28 h-28 md:w-40 md:h-40 animate-float-slower opacity-75"
        style={{ bottom: '15%', left: '-3%' }}
      >
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center shadow-glow-pink transform rotate-[-20deg]">
          <span className="text-3xl md:text-5xl font-black text-primary-foreground">SR</span>
        </div>
      </div>

      <div 
        className="absolute w-36 h-36 md:w-52 md:h-52 animate-float opacity-80"
        style={{ bottom: '10%', right: '0%' }}
      >
        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center shadow-glow-pink transform rotate-[15deg]">
          <span className="text-4xl md:text-6xl font-black text-primary-foreground">SR</span>
        </div>
      </div>
    </div>
  );
}

export const AmbientBackground = memo(AmbientBackgroundComponent);
