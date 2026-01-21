import './LoadingFire.css';

interface LoadingFireProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingFire({ size = 'md', text }: LoadingFireProps) {
  const sizeClasses = {
    sm: 'scale-50',
    md: 'scale-75',
    lg: 'scale-100',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`fire-loader ${sizeClasses[size]}`}>
        {/* Spark */}
        <div className="spark"></div>
        
        {/* Flames */}
        <div className="flames">
          <div className="flame flame-1"></div>
          <div className="flame flame-2"></div>
          <div className="flame flame-3"></div>
        </div>
        
        {/* Logs */}
        <div className="logs">
          <div className="log log-1"></div>
          <div className="log log-2"></div>
        </div>
      </div>
      
      {text && (
        <p className="text-muted-foreground text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
}
