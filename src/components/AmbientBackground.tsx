export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Deep Blue Blob - Top Right */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full animate-float-slower"
        style={{
          background: 'radial-gradient(circle, rgba(0, 163, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(100px)',
          top: '-200px',
          right: '-200px',
        }}
      />
      
      {/* Purple Blob - Bottom Left */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          filter: 'blur(100px)',
          bottom: '-150px',
          left: '-150px',
          animationDirection: 'reverse',
        }}
      />
      
      {/* Subtle Center Blob */}
      <div 
        className="absolute w-[400px] h-[400px] rounded-full animate-float"
        style={{
          background: 'radial-gradient(circle, rgba(0, 163, 255, 0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
}
