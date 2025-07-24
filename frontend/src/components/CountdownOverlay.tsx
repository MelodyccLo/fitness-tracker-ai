import React, { useEffect } from "react";

interface CountdownOverlayProps {
  value: number;
  onComplete: () => void;
  show: boolean;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({
  value,
  onComplete,
  show,
}) => {
  // Removed the useEffect that decremented value here.
  // The value is now controlled by the parent (WorkoutPage).

  // The onComplete logic still belongs here, triggered when value becomes 0 or less.
  useEffect(() => {
    if (!show) return;
    if (value <= 0) {
      onComplete();
    }
  }, [value, show, onComplete]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "8rem", // Bigger font size as per guide
        fontWeight: "bold",
        color: "#fff",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
        zIndex: 10,
        animation: "pulse 1s ease-in-out infinite", // Apply pulse animation
      }}
    >
      {value > 0 ? value : "GO!"}
    </div>
  );
};

export default CountdownOverlay;