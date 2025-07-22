import React, { useState, useEffect, useRef } from "react";

interface WorkoutTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  isRunning,
  onTimeUpdate,
}) => {
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      // Start the timer
      timerRef.current = window.setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;
          onTimeUpdate?.(newSeconds); // Call callback if provided
          return newSeconds;
        });
      }, 1000);
    } else {
      // Stop the timer
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    // Cleanup function for when component unmounts or isRunning changes
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]); // Re-run effect if isRunning or onTimeUpdate changes

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
      {formatTime(seconds)}
    </div>
  );
};

export default WorkoutTimer;
