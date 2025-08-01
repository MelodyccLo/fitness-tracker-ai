import React, { useEffect, useState, useMemo } from "react";
import api from "../utils/api";
import { getUserIdFromToken } from "../utils/authUtils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- CORRECTED PLUGIN DEFINITION ---
// The plugin is a static constant defined outside the component.
// Its type signature now correctly includes getTierColor.
const tierBackgroundPlugin: Plugin<"line", { tiers: ExerciseTier[]; getTierColor: (tierName: string, alpha: number) => string; }> = {
  id: "tierBackground", // The ID used to pass options to it.
  // The 'pluginOptions' argument is how the plugin receives its specific configuration.
  beforeDatasetsDraw(chart, args, pluginOptions) {
    const { tiers, getTierColor } = pluginOptions; // Destructure both properties
    const {
      ctx,
      chartArea: { left, width },
      scales: { y },
    } = chart;
    
    if (!tiers || tiers.length === 0) return;

    tiers.forEach((tier) => {
      const yStart = y.getPixelForValue(
        tier.maxReps === null ? y.max : tier.maxReps
      );
      const yEnd = y.getPixelForValue(tier.minReps);
      const bandHeight = yEnd - yStart;

      ctx.save();
      // Now this call is type-safe
      ctx.fillStyle = getTierColor(tier.name, 0.1);
      ctx.fillRect(left, yStart, width, bandHeight);
      ctx.restore();
    });
  },
  afterDatasetsDraw(chart, args, pluginOptions) {
    const { tiers } = pluginOptions;
    const {
      ctx,
      chartArea: { left, width },
      scales: { y },
    } = chart;
    
    if (!tiers || tiers.length === 0) return;

    ctx.save();
    ctx.font = "bold 12px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "right";
    tiers.forEach((tier) => {
      const yTop = y.getPixelForValue(
        tier.maxReps === null ? y.max : tier.maxReps
      );
      const yBottom = y.getPixelForValue(tier.minReps);
      const yCenter = yTop + (yBottom - yTop) / 2;

      ctx.fillText(tier.name, left + width - 5, yCenter);
    });
    ctx.restore();
  },
};

// We must register the new plugin globally for this pattern to work correctly.
ChartJS.register(tierBackgroundPlugin);

interface ExerciseTier {
  name: string;
  minReps: number;
  maxReps: number | null;
}

interface ExerciseData {
  _id: string;
  name: string;
  tiers: ExerciseTier[];
}

interface WorkoutSessionData {
  _id: string;
  userId: string;
  exerciseId: string;
  sessionDate: string;
  duration: number;
  totalReps: number;
  tierName: string;
  exercise: ExerciseData;
}

const Dashboard: React.FC = () => {
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorSessions, setErrorSessions] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<WorkoutSessionData[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserSessions = async () => {
      const userId = getUserIdFromToken();
      if (!userId) {
        setErrorSessions("User not authenticated.");
        setLoadingSessions(false);
        return;
      }
      try {
        const response = await api.get<WorkoutSessionData[]>(`/sessions/user/${userId}`);
        setUserSessions(response.data);
        if (response.data.length > 0) {
          const uniqueExerciseIds = [...new Set(response.data.map((session) => session.exerciseId))];
          if (uniqueExerciseIds.length > 0) {
            setSelectedExercise((prev) => prev ?? uniqueExerciseIds[0]);
          }
        }
      } catch (err: any) {
        setErrorSessions(err.response?.data?.message || "Failed to load data.");
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchUserSessions();
  }, []);

  const uniqueExercises = useMemo(() => {
    return [...new Map(userSessions.map((s) => [s.exercise._id, s.exercise])).values()];
  }, [userSessions]);

  const filteredSessions = useMemo(() => {
    return selectedExercise ? userSessions.filter((s) => s.exerciseId === selectedExercise) : [];
  }, [selectedExercise, userSessions]);

  const chartData = useMemo(() => {
    if (!selectedExercise || filteredSessions.length === 0) {
      return { labels: [], datasets: [] };
    }
    const sessionsForChart = [...filteredSessions].sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
    return {
      labels: sessionsForChart.map((s) => new Date(s.sessionDate).toLocaleDateString()),
      datasets: [
        {
          label: "Total Reps",
          data: sessionsForChart.map((s) => s.totalReps),
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          tension: 0.1,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    } as ChartData<"line">;
  }, [selectedExercise, filteredSessions]);

  const exerciseTiers = useMemo(() => {
    if (!selectedExercise || filteredSessions.length === 0) return [];
    const exercise = filteredSessions[0]?.exercise;
    return exercise ? [...exercise.tiers].sort((a, b) => a.minReps - b.minReps) : [];
  }, [selectedExercise, filteredSessions]);

  const getTierColor = (tierName: string, alpha: number = 1): string => {
    switch (tierName.toLowerCase()) {
      case "beginner": return `rgba(255, 99, 132, ${alpha})`;
      case "developing": return `rgba(255, 159, 64, ${alpha})`;
      case "competent": return `rgba(255, 205, 86, ${alpha})`;
      case "proficient": return `rgba(75, 192, 192, ${alpha})`;
      case "elite": return `rgba(54, 162, 235, ${alpha})`;
      default: return `rgba(200, 200, 200, ${alpha})`;
    }
  };

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        // --- THIS IS THE KEY CHANGE ---
        // We pass the dynamic data to our plugin via its ID ('tierBackground').
        tierBackground: {
          tiers: exerciseTiers,
          getTierColor: getTierColor, // Pass the color function too
        },
        legend: { position: "top" as const },
        title: {
          display: true,
          text: filteredSessions.length > 0 ? `${filteredSessions[0]?.exercise.name} Reps Over Time` : "Workout Progress",
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              const label = context.dataset.label || "";
              const value = context.parsed.y;
              const session = filteredSessions[context.dataIndex];
              return `${label}: ${value} (Tier: ${session?.tierName || "N/A"})`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Reps Completed" },
          max:
            exerciseTiers.length > 0 && exerciseTiers.at(-1)?.maxReps === null
              ? Math.max(
                  Math.max(...(chartData.datasets[0]?.data as number[] || [0])),
                  (exerciseTiers.at(-2)?.maxReps || 0) + 10
                )
              : undefined,
        },
        x: { title: { display: true, text: "Date" } },
      },
    }),
    [filteredSessions, chartData, exerciseTiers] // Simplified dependencies
  );

  // --- JSX Rendering (no major changes) ---
  if (loadingSessions) return <div className="container mt-5"><p>Loading progress...</p></div>;
  if (errorSessions) return <div className="container mt-5"><div className="alert alert-danger">Error: {errorSessions}</div></div>;

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-header"><h2>Your Fitness Progress</h2></div>
        <div className="card-body">
          {userSessions.length === 0 ? (
            <p>No workout sessions found yet. Complete a workout to see your progress!</p>
          ) : (
            <>
              <div className="mb-4">
                <label htmlFor="exercise-select" className="form-label">Select Exercise:</label>
                <select id="exercise-select" className="form-select" value={selectedExercise || ""} onChange={(e) => setSelectedExercise(e.target.value)}>
                  {uniqueExercises.map((ex) => (<option key={ex._id} value={ex._id}>{ex.name}</option>))}
                </select>
              </div>
              {selectedExercise && filteredSessions.length > 0 ? (
                <div style={{ height: "400px", width: "100%" }}>
                  <Line data={chartData} options={chartOptions} />
                  {/* The plugin is now registered globally, so we don't pass it here */}
                </div>
              ) : (
                <p>Please select an exercise to view its progress.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;