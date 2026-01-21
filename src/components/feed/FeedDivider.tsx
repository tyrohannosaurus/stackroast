export function FeedDivider() {
    return (
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-canvas px-4 text-sm text-muted-foreground">
            More Roasts
          </span>
        </div>
      </div>
    );
  }