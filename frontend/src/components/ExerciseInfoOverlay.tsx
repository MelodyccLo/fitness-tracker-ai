import React from "react";

interface ExerciseInfoOverlayProps {
  reps: number;
  feedback: string;
  show: boolean;
}

const ExerciseInfoOverlay: React.FC<ExerciseInfoOverlayProps> = ({
  reps,
  feedback,
  show,
}) => {
  if (!show) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "20px",
        left: "20px",
        right: "20px",
        backgroundColor: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "15px",
        borderRadius: "10px",
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h4 style={{ margin: 0, color: "#28a745" }}>Reps: {reps}</h4>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{feedback}</p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseInfoOverlay;