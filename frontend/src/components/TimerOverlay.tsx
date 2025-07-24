import React, { useState, useEffect, useRef } from 'react';

interface TimerOverlayProps {
  isRunning: boolean;
  seconds: number; // This will now be the initial value for countdown
  show: boolean;
  onTimeUpdate?: (seconds: number) => void;
  isCountdown?: boolean; // NEW PROP: true if it's a countdown, false/undefined if count up
}

const TimerOverlay: React.FC<TimerOverlayProps> = ({ isRunning, seconds: initialSeconds, show, onTimeUpdate, isCountdown = false }) => {
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const intervalIdRef = useRef<number | null>(null);

  // Sync internal state with prop for initial value or resets from parent
  useEffect(() => {
    setCurrentSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const cleanupInterval = () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    if (isRunning) {
      cleanupInterval(); // Clear any existing interval
      intervalIdRef.current = window.setInterval(() => {
        setCurrentSeconds(prevSeconds => {
          if (isCountdown) {
            // Counting down
            if (prevSeconds <= 0) {
              cleanupInterval(); // Stop at 0
              return 0;
            }
            return prevSeconds - 1;
          } else {
            // Counting up
            return prevSeconds + 1;
          }
        });
      }, 1000);
    } else {
      cleanupInterval(); // Stop the interval if not running
    }

    return cleanupInterval; // Cleanup on unmount or isRunning change
  }, [isRunning, isCountdown]);

  // Communicate internal seconds back to parent
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(currentSeconds);
    }
  }, [currentSeconds, onTimeUpdate]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!show) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "#fff",
        padding: "10px 20px",
        borderRadius: "25px",
        fontSize: "1.5rem",
        fontWeight: "bold",
        zIndex: 10,
        fontFamily: "monospace",
      }}
    >
      {formatTime(currentSeconds)}
    </div>
  );
};

export default TimerOverlay;
