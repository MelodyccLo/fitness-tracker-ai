// frontend/src/components/Dashboard.tsx

import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { getUserIdFromToken } from '../utils/authUtils';

// Import Chart.js components
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
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components (do this once in your app, e.g., here or in App.tsx)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Define interfaces for the data we expect
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

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  age?: number;
  height?: number;
  weight?: number;
  fitnessLevel?: string;
}

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [errorSessions, setErrorSessions] = useState<string | null>(null);
  const [userSessions, setUserSessions] = useState<WorkoutSessionData[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Effect to fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        setUser(res.data);
      } catch (err: any) {
        console.error('Failed to fetch user profile:', err);
        setErrorProfile(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // Effect to fetch user workout sessions
  useEffect(() => {
    const fetchUserSessions = async () => {
      const userId = getUserIdFromToken();
      if (!userId) {
        setErrorSessions('User not authenticated. Please log in to view progress.');
        setLoadingSessions(false);
        return;
      }

      try {
        const response = await api.get<WorkoutSessionData[]>(`/sessions/user/${userId}`);
        setUserSessions(response.data);
        setLoadingSessions(false);
        if (response.data.length > 0 && selectedExercise === null) {
          const uniqueExerciseIds = [...new Set(response.data.map(session => session.exerciseId))];
          if (uniqueExerciseIds.length > 0) {
            setSelectedExercise(uniqueExerciseIds[0]);
          }
        }
      } catch (err: any) {
        console.error('Error fetching user sessions:', err);
        setErrorSessions(err.response?.data?.message || 'Failed to load progress data.');
        setLoadingSessions(false);
      }
    };

    if (!loadingProfile && !errorProfile) {
      fetchUserSessions();
    }
  }, [loadingProfile, errorProfile, selectedExercise]);

  // --- REORDERED useMemo HOOKS ---
  // Ensure uniqueExercises and filteredSessions are defined before they are used by other useMemos
  const uniqueExercises = useMemo(() => {
    return [...new Map(userSessions.map(session => [session.exercise._id, session.exercise])).values()];
  }, [userSessions]);

  const filteredSessions = useMemo(() => {
    return selectedExercise
      ? userSessions.filter(session => session.exerciseId === selectedExercise)
      : [];
  }, [selectedExercise, userSessions]);

  // Prepare data for the chart
  const chartData = useMemo(() => {
    if (!selectedExercise || filteredSessions.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sessionsForChart = [...filteredSessions].sort((a, b) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());

    return {
      labels: sessionsForChart.map(session => new Date(session.sessionDate).toLocaleDateString()),
      datasets: [
        {
          label: 'Total Reps',
          data: sessionsForChart.map(session => session.totalReps),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 8,
        },
      ],
    } as ChartData<'line'>;
  }, [selectedExercise, filteredSessions]); // Dependency on filteredSessions

  // Prepare tier information for the custom plugin
  const exerciseTiers = useMemo(() => {
    if (!selectedExercise || filteredSessions.length === 0) return []; // Use filteredSessions
    const exercise = filteredSessions[0]?.exercise; // Access exercise from first filtered session
    return exercise ? [...exercise.tiers].sort((a, b) => a.minReps - b.minReps) : [];
  }, [selectedExercise, filteredSessions]); // Dependency on filteredSessions


  // Custom Chart.js Plugin to draw background bands for tiers
  const tierBackgroundPlugin: Plugin<'line'> = {
    id: 'tierBackground',
    beforeDatasetsDraw(chart, args, options) {
      const { ctx, chartArea: { left, width }, scales: { y } } = chart; // Removed unused 'right', 'top', 'bottom', 'height'
      if (exerciseTiers.length === 0) return;

      exerciseTiers.forEach(tier => {
        const yStart = y.getPixelForValue(tier.maxReps === null ? y.max : tier.maxReps); // Use chart's max for null
        const yEnd = y.getPixelForValue(tier.minReps);

        const bandHeight = yEnd - yStart;

        ctx.save();
        ctx.fillStyle = getTierColor(tier.name, 0.1); // Use a light, transparent color
        ctx.fillRect(left, yStart, width, bandHeight);
        ctx.restore();
      });
    },
    // Optional: Draw tier labels
    afterDatasetsDraw(chart, args, options) {
      const { ctx, chartArea: { left, width }, scales: { y } } = chart; // Removed unused variables
      if (exerciseTiers.length === 0) return;

      ctx.save();
      ctx.font = 'bold 12px Arial';
      ctx.fillStyle = '#666'; // Darker color for labels
      ctx.textAlign = 'right';

      exerciseTiers.forEach(tier => {
        const yTop = y.getPixelForValue(tier.maxReps === null ? y.max : tier.maxReps);
        const yBottom = y.getPixelForValue(tier.minReps);
        const yCenter = yTop + (yBottom - yTop) / 2;

        ctx.fillText(tier.name, left + width - 5, yCenter); // Draw label on the right side
      });
      ctx.restore();
    }
  };

  // Helper function to get a consistent color for tiers
  const getTierColor = (tierName: string, alpha: number = 1): string => {
    switch (tierName.toLowerCase()) {
      case 'beginner': return `rgba(255, 99, 132, ${alpha})`; // Red
      case 'developing': return `rgba(255, 159, 64, ${alpha})`; // Orange
      case 'competent': return `rgba(255, 205, 86, ${alpha})`; // Yellow
      case 'proficient': return `rgba(75, 192, 192, ${alpha})`; // Green-ish
      case 'elite': return `rgba(54, 162, 235, ${alpha})`; // Blue
      default: return `rgba(200, 200, 200, ${alpha})`; // Gray
    }
  };

  // Chart Options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        // Ensure filteredSessions[0] is safely accessed
        text: filteredSessions.length > 0 ? `${filteredSessions[0]?.exercise.name} Reps Over Time` : 'Workout Progress',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const sessionDate = chartData.labels?.[context.dataIndex]; // Safe access
            const session = filteredSessions.find(s => new Date(s.sessionDate).toLocaleDateString() === sessionDate);
            return `${label}: ${value} (Tier: ${session?.tierName || 'N/A'})`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Reps Completed',
        },
        max: exerciseTiers.length > 0 && exerciseTiers[exerciseTiers.length - 1].maxReps === null
             ? Math.max(
                 (chartData.datasets[0]?.data.length > 0 ? Math.max(...(chartData.datasets[0]?.data as number[])) : 0), // Get max from actual data
                 (exerciseTiers[exerciseTiers.length - 2]?.maxReps || 0) + 10 // Buffer from second-to-last tier's max
               )
             : undefined,
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  }), [filteredSessions, chartData.labels, chartData.datasets, exerciseTiers]);


  if (loadingProfile || loadingSessions) {
    return (
      <div className="container mt-5">
        <p>Loading dashboard and progress data...</p>
      </div>
    );
  }

  if (errorProfile || errorSessions) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          Error: {errorProfile || errorSessions}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mt-5">
        <p>No user data found. Please ensure you are logged in.</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="card mb-5">
        <div className="card-header">
          <h2>Dashboard</h2>
        </div>
        <div className="card-body">
          <h5 className="card-title">Welcome, {user.username}!</h5>
          <p className="card-text">Email: {user.email}</p>
          {user.age && <p className="card-text">Age: {user.age}</p>}
          {user.height && <p className="card-text">Height: {user.height} cm</p>}
          {user.weight && <p className="card-text">Weight: {user.weight} kg</p>}
          {user.fitnessLevel && <p className="card-text">Fitness Level: {user.fitnessLevel}</p>}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Your Fitness Progress</h2>
        </div>
        <div className="card-body">
          {userSessions.length === 0 ? (
            <p>No workout sessions found yet. Complete some workouts to see your progress here!</p>
          ) : (
            <>
              {/* Exercise Selection Dropdown */}
              <div className="mb-4">
                <label htmlFor="exercise-select" className="form-label">Select Exercise:</label>
                <select
                  id="exercise-select"
                  className="form-select"
                  value={selectedExercise || ''}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                >
                  <option value="">-- Select an Exercise --</option>
                  {uniqueExercises.map((ex) => (
                    <option key={ex._id} value={ex._id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedExercise && filteredSessions.length > 0 ? (
                <div style={{ height: '400px', width: '100%' }}>
                  <Line data={chartData} options={chartOptions} plugins={[tierBackgroundPlugin]} />
                </div>
              ) : (
                <p>Please select an exercise to view its progress, or complete a workout.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;