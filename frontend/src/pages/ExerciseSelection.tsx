import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { Link } from "react-router-dom";
import { ExerciseCheckpoint } from "../utils/poseUtils"; // Import the interface

// Interface for Exercise data matching your backend model
interface Exercise {
  _id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  checkpoints: ExerciseCheckpoint[];
  instructions: string[];
  difficulty: string;
}

const ExerciseSelection: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await api.get<Exercise[]>("/exercises"); // Fetch all exercises
        setExercises(res.data);
      } catch (err: any) {
        console.error("Error fetching exercises:", err);
        setError(err.response?.data?.message || "Failed to load exercises");
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  if (loading) return <div className="p-4">Loading exercises...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Select an Exercise</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.length === 0 ? (
          <p>No exercises available. Please add some from the backend first.</p>
        ) : (
          exercises.map((exercise) => (
            <div key={exercise._id} className="border p-4 rounded shadow-sm">
              <h2 className="text-xl font-semibold mb-2">{exercise.name}</h2>
              <p className="text-gray-600 mb-2">{exercise.description}</p>
              <p className="text-gray-500 text-sm">
                Difficulty: {exercise.difficulty}
              </p>
              <Link
                to={`/exercise/${exercise._id}`}
                className="mt-4 inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Start Workout
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseSelection;
