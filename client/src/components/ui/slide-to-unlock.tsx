import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

interface SlideToUnlockProps {
  onUnlock: () => void;
  text?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SlideToUnlock({ 
  onUnlock, 
  text = "Zum Bestätigen schieben", 
  isLoading = false,
  disabled = false 
}: SlideToUnlockProps) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    if (disabled || isLoading || isUnlocked) return;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;

    const container = containerRef.current;
    const slider = sliderRef.current;
    const containerRect = container.getBoundingClientRect();
    const sliderWidth = slider.offsetWidth;
    const maxPosition = containerRect.width - sliderWidth;

    let newPosition = clientX - containerRect.left - sliderWidth / 2;
    newPosition = Math.max(0, Math.min(newPosition, maxPosition));

    setSliderPosition(newPosition);

    // Check if slider is at the end (within 10px tolerance)
    if (newPosition >= maxPosition - 10) {
      setIsUnlocked(true);
      setIsDragging(false);
      setTimeout(() => {
        onUnlock();
      }, 100);
    }
  };

  const handleEnd = () => {
    if (!isUnlocked) {
      // Snap back to start with animation
      setSliderPosition(0);
    }
    setIsDragging(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`
        relative h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg overflow-hidden
        ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${isUnlocked ? 'bg-gradient-to-r from-green-500 to-green-600' : ''}
      `}
      data-testid="slide-to-unlock-container"
    >
      {/* Progress background */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 transition-all duration-300"
        style={{
          width: `${containerRef.current ? (sliderPosition / (containerRef.current.offsetWidth - 64)) * 100 : 0}%`,
        }}
      />

      {/* Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`
          text-white font-medium text-sm transition-opacity duration-300
          ${sliderPosition > 50 ? 'opacity-0' : 'opacity-100'}
        `}>
          {isLoading ? 'Wird gespeichert...' : text}
        </span>
      </div>

      {/* Slider */}
      <div
        ref={sliderRef}
        className={`
          absolute top-2 left-2 h-12 w-12 bg-white rounded-md
          flex items-center justify-center shadow-lg
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          ${isUnlocked ? 'bg-green-100' : ''}
        `}
        style={{
          transform: `translateX(${sliderPosition}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        data-testid="slide-to-unlock-slider"
      >
        {isLoading ? (
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        ) : isUnlocked ? (
          <ChevronRight className="w-6 h-6 text-green-600" />
        ) : (
          <>
            <ChevronRight className="w-6 h-6 text-blue-600 -ml-1" />
            <ChevronRight className="w-6 h-6 text-blue-600 -ml-4" />
            <ChevronRight className="w-6 h-6 text-blue-600 -ml-4" />
          </>
        )}
      </div>
    </div>
  );
}
