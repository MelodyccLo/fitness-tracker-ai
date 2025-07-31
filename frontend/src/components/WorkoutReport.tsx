import React from "react";

interface WorkoutReportData {
  exerciseName: string;
  duration: number; // Still part of the data, but won't be displayed
  totalReps: number;
  accuracy: number;
  completedAt: Date;
  tierName: string; // NEW: Add tierName to the interface here
}

interface WorkoutReportProps {
  report: WorkoutReportData | null;
  onClose: () => void;
  show: boolean;
}

const WorkoutReport: React.FC<WorkoutReportProps> = ({
  report,
  onClose,
  show,
}) => {
  if (!show || !report) return null;

  // You can optionally format duration if you decide to display it later
  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          padding: "40px",
          borderRadius: "12px",
          textAlign: "center",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        <h2 style={{ color: "#28a745", marginBottom: "30px" }}>
          Workout Complete!
        </h2>
        <div style={{ marginBottom: "30px" }}>
          <h3>{report.exerciseName}</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr", // Changed from "1fr 1fr" to "1fr" to have a single column
              gap: "20px",
              marginTop: "20px",
            }}
          >
            {/* Removed the Duration display section */}
            {/* Keeping it commented out as per your previous instruction */}
            {/*
            <div>
              <h4 style={{ color: "#007bff" }}>Duration</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {formatTime(report.duration)}
              </p>
            </div>
            */}
            <div>
              <h4 style={{ color: "#007bff" }}>Reps Completed</h4>
              <p style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                {report.totalReps}
              </p>
            </div>
            {/* NEW: Display the achieved Tier */}
            {report.tierName && (
              <div>
                <h4 style={{ color: "#28a745" }}>Achieved Tier</h4>
                <p
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                  }}
                >
                  {report.tierName}
                </p>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "12px 30px",
            borderRadius: "6px",
            fontSize: "1.1rem",
            cursor: "pointer",
            marginRight: "10px",
          }}
        >
          Start New Workout
        </button>
        <button
          onClick={() => window.history.back()}
          style={{
            backgroundColor: "#6c757d",
            color: "#fff",
            border: "none",
            padding: "12px 30px",
            borderRadius: "6px",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
        >
          Back to Exercises
        </button>
      </div>
    </div>
  );
};

export default WorkoutReport;
