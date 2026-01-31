import { memo } from 'react';

// Clean, minimal background - no decorative elements per Gumroad design system
function AmbientBackgroundComponent() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      {/* Subtle gradient for depth */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at top, hsl(var(--background-secondary)) 0%, hsl(var(--background)) 70%)',
        }}
      />
    </div>
  );
}

export const AmbientBackground = memo(AmbientBackgroundComponent);
