import React, { useState, useEffect, useRef } from 'react';

interface WorkoutTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({ isRunning, onTimeUpdate }) => {
  const [seconds, setSeconds] = useState(0);
  const intervalIdRef = useRef<number | null>(null); // Use a more specific name for clarity

  useEffect(() => {
    // --- Cleanup function ---
    const cleanupInterval = () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };

    if (isRunning) {
      // Clear any existing interval to prevent multiple intervals running
      cleanupInterval();

      // Start the interval
      intervalIdRef.current = window.setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1); // Update internal state
      }, 1000);
    } else {
      // Stop the interval if not running
      cleanupInterval();
    }

    // This cleanup runs when the component unmounts OR when isRunning changes
    return cleanupInterval;
  }, [isRunning]); // Dependency array: only re-run if isRunning changes

  // --- New useEffect to handle external communication ---
  // This effect runs whenever 'seconds' changes internally in WorkoutTimer
  // and then calls the parent's onTimeUpdate as a side effect.
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(seconds); // Communicate updated seconds to parent
    }
  }, [seconds, onTimeUpdate]); // Depend on internal 'seconds' state and 'onTimeUpdate' prop

  // Effect to reset seconds when workout stops (if you want this behavior)
  // This should be done based on the parent's 'isRunning' prop
  useEffect(() => {
      if (!isRunning) {
          setSeconds(0); // Reset timer display when workout is explicitly stopped
      }
  }, [isRunning]); // Depend on isRunning

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
      {formatTime(seconds)}
    </div>
  );
};

export default WorkoutTimer;