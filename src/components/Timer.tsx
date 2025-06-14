import { useState, useEffect } from 'react';

interface TimerProps {
  endTime: number | null; // timestamp when round ends
  duration: number; // total duration in seconds
  onTimeUp?: () => void;
}

const Timer: React.FC<TimerProps> = ({ endTime, duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0 && onTimeUp) {
        onTimeUp();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [endTime, onTimeUp]);

  if (!endTime) {
    return null;
  }

  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const isUrgent = timeLeft <= 10;
  const isCritical = timeLeft <= 5;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Circular Progress */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="stroke-current text-border"
            strokeWidth="3"
            fill="transparent"
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Progress circle */}
          <path
            className={`stroke-current transition-all duration-1000 ${
              isCritical 
                ? 'text-red-500' 
                : isUrgent 
                ? 'text-yellow-500' 
                : 'text-green-500'
            }`}
            strokeWidth="3"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845
              a 15.9155 15.9155 0 0 1 0 31.831
              a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        {/* Time text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${
            isCritical 
              ? 'text-red-500' 
              : isUrgent 
              ? 'text-yellow-500' 
              : 'text-foreground'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Progress Bar (alternative layout) */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">Time Remaining</span>
          <span className={`text-sm font-bold ${
            isCritical 
              ? 'text-red-500' 
              : isUrgent 
              ? 'text-yellow-500' 
              : 'text-foreground'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <div className="w-full bg-border rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              isCritical 
                ? 'bg-red-500' 
                : isUrgent 
                ? 'bg-yellow-500' 
                : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Timer; 