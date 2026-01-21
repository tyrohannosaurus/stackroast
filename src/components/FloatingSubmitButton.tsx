import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Flame } from 'lucide-react';
import { SubmitStackDialog } from '@/components/SubmitStackDialog';

export function FloatingSubmitButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Action Button - Fixed Position */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setDialogOpen(true)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="
            shadow-2xl rounded-full h-14 overflow-hidden
            bg-gradient-to-r from-orange-500 to-red-500 
            hover:from-orange-600 hover:to-red-600
            transition-all duration-300 ease-out
            text-white font-medium
          "
          style={{
            width: isHovered ? '200px' : '56px',
          }}
        >
          <div className="h-full flex items-center justify-center">
            {isHovered ? (
              <div className="flex items-center gap-2 px-4">
                <Flame className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">Submit Your Stack</span>
              </div>
            ) : (
              <Plus className="w-6 h-6" />
            )}
          </div>
        </button>
      </div>

      {/* Submit Dialog */}
      <SubmitStackDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}