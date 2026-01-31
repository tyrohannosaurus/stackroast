export function AmbientBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle dot pattern overlay */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Floating decorative elements */}
      <div 
        className="absolute w-16 h-16 rounded-xl animate-float-slower"
        style={{
          background: 'hsl(var(--sky))',
          border: '2px solid hsl(var(--border))',
          boxShadow: '4px 4px 0px hsl(var(--border))',
          top: '15%',
          right: '10%',
          transform: 'rotate(-12deg)',
        }}
      />
      
      <div 
        className="absolute w-12 h-12 rounded-full animate-float-slow"
        style={{
          background: 'hsl(var(--accent))',
          border: '2px solid hsl(var(--border))',
          boxShadow: '4px 4px 0px hsl(var(--border))',
          top: '25%',
          left: '8%',
        }}
      />
      
      <div 
        className="absolute w-20 h-20 rounded-2xl animate-float"
        style={{
          background: 'hsl(var(--mint))',
          border: '2px solid hsl(var(--border))',
          boxShadow: '4px 4px 0px hsl(var(--border))',
          bottom: '20%',
          right: '15%',
          transform: 'rotate(8deg)',
        }}
      />
      
      <div 
        className="absolute w-10 h-10 rounded-lg animate-float-slower"
        style={{
          background: 'hsl(var(--lavender))',
          border: '2px solid hsl(var(--border))',
          boxShadow: '4px 4px 0px hsl(var(--border))',
          bottom: '30%',
          left: '12%',
          transform: 'rotate(-6deg)',
        }}
      />
    </div>
  );
}
