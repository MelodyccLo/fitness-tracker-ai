import React from "react";
import { useNavigate } from "react-router-dom";

// Helper function to get a consistent color for tiers
const getTierColor = (tierName: string, alpha: number = 1): string => {
  switch (tierName.toLowerCase()) {
    case "beginner":
      return `rgba(255, 99, 132, ${alpha})`;
    case "developing":
      return `rgba(255, 159, 64, ${alpha})`;
    case "competent":
      return `rgba(255, 205, 86, ${alpha})`;
    case "proficient":
      return `rgba(75, 192, 192, ${alpha})`;
    case "elite":
      return `rgba(54, 162, 235, ${alpha})`;
    default:
      return `rgba(200, 200, 200, ${alpha})`;
  }
};

interface WorkoutReportData {
  exerciseName: string;
  duration: number;
  totalReps: number;
  accuracy: number;
  completedAt: Date;
  tierName: string;
  tierMinReps: number;
  tierMaxReps: number | null;
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
  const navigate = useNavigate();

  if (!show || !report) return null;

  let progressPercentage = 0;
  if (report.tierMaxReps === null) {
    progressPercentage = 100;
  } else {
    const tierRange = report.tierMaxReps - report.tierMinReps;
    const repsIntoTier = report.totalReps - report.tierMinReps;
    if (tierRange > 0) {
      progressPercentage = (repsIntoTier / tierRange) * 100;
      progressPercentage = Math.min(100, Math.max(0, progressPercentage));
    } else {
      if (report.totalReps >= report.tierMinReps) progressPercentage = 100;
    }
  }

  const tierBaseColor = getTierColor(report.tierName);
  const tierProgressBarColor = getTierColor(report.tierName, 0.8);

  return (
    <div
      className="workout-report-overlay"
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
        className="workout-report-card card"
        style={{
          textAlign: "center",
          maxWidth: "500px",
          width: "90%",
        }}
      >
        {/* === CARD-BODY WRAPPER ADDED HERE === */}
        <div
          className="card-body"
          style={{
            padding: "30px",
          }}
        >
          <h2 className="card-title mb-4" style={{ color: "var(--primary-color)" }}>
            Workout Complete!
          </h2>

          <h3 className="mb-3" style={{ color: "var(--heading-color)" }}>
            {report.exerciseName}
          </h3>

          <div className="mb-4">
            <p className="lead fw-bold mb-1" style={{ fontSize: "2.5rem", color: "var(--text-color)" }}>
              {report.totalReps}
            </p>
            <p className="text-muted mb-3" style={{ fontSize: "1.2rem", textTransform: "uppercase" }}>
              Achieved Tier:{" "}
              <span className="fw-bold" style={{ color: tierBaseColor }}>
                {report.tierName}
              </span>
            </p>

            <div className="tier-meter mt-4">
              <div className="tier-meter-label">
                {report.tierMinReps} Reps
                <span>
                  {report.tierMaxReps !== null
                    ? `${report.tierMaxReps} Reps`
                    : `Elite Tier`}
                </span>
              </div>
              <div
                className="progress"
                style={{
                  height: "20px",
                  backgroundColor: `rgba(${tierBaseColor.match(/\d+/g)?.slice(0, 3).join(",")}, 0.3)` || "#eee",
                }}
              >
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{
                    width: `${progressPercentage}%`,
                    backgroundColor: tierProgressBarColor,
                  }}
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {progressPercentage.toFixed(0)}%
                </div>
              </div>
              <p className="text-muted mt-2">
                Progress within {report.tierName} Tier
              </p>
            </div>
          </div>

          <div className="d-flex justify-content-center flex-wrap gap-3">
            <button onClick={onClose} className="btn btn-primary btn-lg">
              Start New Workout
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-info btn-lg"
            >
              See Full Report
            </button>
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary btn-lg"
            >
              Back to Exercises
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutReport;