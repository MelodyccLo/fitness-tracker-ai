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
    <div className="container mt-5">
      <h1 className="text-3xl font-bold mb-4">Select an Exercise</h1>
      <div className="row">
        {exercises.length === 0 ? (
          <p>No exercises available. Please add some from the backend first.</p>
        ) : (
          exercises.map((exercise) => (
            <div className="col-md-4 mb-4" key={exercise._id}>
              <Link to={`/workout/${exercise._id}`} className="card-link text-decoration-none text-dark">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{exercise.name}</h5>
                    <p className="card-text">{exercise.description}</p>
                    <p className="card-text"><small className="text-muted">Difficulty: {exercise.difficulty}</small></p>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseSelection;
