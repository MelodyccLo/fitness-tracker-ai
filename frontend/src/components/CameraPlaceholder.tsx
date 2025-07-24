import React from "react";
import { Exercise } from "../utils/poseUtils"; // Still import Exercise interface for prop typing

interface CameraPlaceholderProps {
  show: boolean;
  onStart: () => void;
  exercise: Exercise | null; // Keep for consistency of prop passing, even if not displayed
  cameraError: string | null;
}

const CameraPlaceholder: React.FC<CameraPlaceholderProps> = ({
  show,
  onStart,
  exercise, // Keep exercise prop, just don't display it directly here
  cameraError,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        color: "#fff",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div style={{ textAlign: "center", color: "#fff" }}>
        <h3>Ready to start your workout?</h3>
        <p>Press Start to activate camera and begin.</p>
        {cameraError && (
          <p style={{ color: "red", marginTop: "10px" }}>
            <strong>Camera Error:</strong> {cameraError}
          </p>
        )}
        {/* Removed redundant exercise name and description here.
            This information is already displayed in the main header
            when workoutPhase is 'idle'.
        <div style={{ marginTop: "20px" }}>
            <strong>{exercise?.name}</strong>
            <p>{exercise?.description}</p>
        </div>
        */}
      </div>
    </div>
  );
};

export default CameraPlaceholder;