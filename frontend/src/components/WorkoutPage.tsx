import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import {
  Landmark,
  calculateAngle,
  RepCounter,
  ExerciseCheckpoint,
} from "../utils/poseUtils";
import api from "../utils/api";
import WorkoutTimer from "../components/WorkoutTimer";

interface Exercise {
  _id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  checkpoints: ExerciseCheckpoint[];
  instructions: string[];
  difficulty: string;
}

const WorkoutPage: React.FC = () => {
  const { id: exerciseId } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const repCounterRef = useRef<RepCounter | null>(null);

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [currentReps, setCurrentReps] = useState(0);
  const [formFeedback, setFormFeedback] = useState("Stand still to begin.");
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Helper mapping from descriptive name to MediaPipe's numerical index
  const landmarkNameToIndex = useMemo(() => {
    // Add an index signature to the return type of this useMemo
    const map: { [key: string]: number } = {
      nose: 0,
      left_eye_inner: 1,
      left_eye: 2,
      left_eye_outer: 3,
      right_eye_inner: 4,
      right_eye: 5,
      right_eye_outer: 6,
      left_ear: 7,
      right_ear: 8,
      mouth_left: 9,
      mouth_right: 10,
      left_shoulder: 11,
      right_shoulder: 12,
      left_elbow: 13,
      right_elbow: 14,
      left_wrist: 15,
      right_wrist: 16,
      left_pinky: 17,
      right_pinky: 18,
      left_index: 19,
      right_index: 20,
      left_thumb: 21,
      right_thumb: 22,
      left_hip: 23,
      right_hip: 24,
      left_knee: 25,
      right_knee: 26,
      left_ankle: 27,
      right_ankle: 28,
      left_heel: 29,
      right_heel: 30,
      left_foot_index: 31,
      right_foot_index: 32,
    };
    return map;
  }, []); // Empty dependency array means it's created only once

  const onResults = useCallback(
    (results: Results) => {
      if (
        !contextRef.current ||
        !canvasRef.current ||
        !videoRef.current ||
        !exercise
      )
        return;

      const canvasCtx = contextRef.current;

      canvasCtx.save();
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      canvasCtx.drawImage(
        results.image,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      if (results.poseLandmarks) {
        const mpLandmarks = results.poseLandmarks;
        const landmarksMap: { [key: string]: Landmark } = {};

        if (mpLandmarks[11])
          landmarksMap["left_shoulder"] = mpLandmarks[11] as Landmark;
        if (mpLandmarks[12])
          landmarksMap["right_shoulder"] = mpLandmarks[12] as Landmark;
        if (mpLandmarks[13])
          landmarksMap["left_elbow"] = mpLandmarks[13] as Landmark;
        if (mpLandmarks[14])
          landmarksMap["right_elbow"] = mpLandmarks[14] as Landmark;
        if (mpLandmarks[15])
          landmarksMap["left_wrist"] = mpLandmarks[15] as Landmark;
        if (mpLandmarks[16])
          landmarksMap["right_wrist"] = mpLandmarks[16] as Landmark;
        if (mpLandmarks[23])
          landmarksMap["left_hip"] = mpLandmarks[23] as Landmark;
        if (mpLandmarks[24])
          landmarksMap["right_hip"] = mpLandmarks[24] as Landmark;
        if (mpLandmarks[25])
          landmarksMap["left_knee"] = mpLandmarks[25] as Landmark;
        if (mpLandmarks[26])
          landmarksMap["right_knee"] = mpLandmarks[26] as Landmark;
        if (mpLandmarks[27])
          landmarksMap["left_ankle"] = mpLandmarks[27] as Landmark;
        if (mpLandmarks[28])
          landmarksMap["right_ankle"] = mpLandmarks[28] as Landmark;

        let overallFormCorrect = true;
        let currentFrameFeedback = "";
        const jointsToHighlightRed: number[] = [];
        const connectionsToHighlightRed: [number, number][] = [];

        if (isWorkoutRunning && repCounterRef.current) {
          exercise.checkpoints.forEach((checkpoint) => {
            const p1 = landmarksMap[checkpoint.keypoint1];
            const p2 = landmarksMap[checkpoint.keypoint2];
            const p3 = landmarksMap[checkpoint.keypoint3];

            if (
              !p1 ||
              !p2 ||
              !p3 ||
              (p1.visibility && p1.visibility < 0.8) ||
              (p2.visibility && p2.visibility < 0.8) ||
              (p3.visibility && p3.visibility < 0.8)
            ) {
              overallFormCorrect = false;
              if (currentFrameFeedback === "") {
                currentFrameFeedback = "Ensure full body is visible!";
              }
              
              const p1Idx = landmarkNameToIndex[checkpoint.keypoint1];
              const p2Idx = landmarkNameToIndex[checkpoint.keypoint2];
              const p3Idx = landmarkNameToIndex[checkpoint.keypoint3];

              if (p1Idx !== undefined && !jointsToHighlightRed.includes(p1Idx))
                jointsToHighlightRed.push(p1Idx);
              if (p2Idx !== undefined && !jointsToHighlightRed.includes(p2Idx))
                jointsToHighlightRed.push(p2Idx);
              if (p3Idx !== undefined && !jointsToHighlightRed.includes(p3Idx))
                jointsToHighlightRed.push(p3Idx);

              return;
            }

            const currentAngle = calculateAngle(p1, p2, p3);
            const isInRange =
              Math.abs(currentAngle - checkpoint.targetAngle) <=
              checkpoint.tolerance;

            if (!isInRange) {
              overallFormCorrect = false;
              if (currentAngle < checkpoint.targetAngle) {
                currentFrameFeedback = `Too shallow at ${
                  checkpoint.keypoint2
                }! Angle: ${currentAngle.toFixed(0)}°`;
              } else {
                currentFrameFeedback = `Too deep/overextended at ${
                  checkpoint.keypoint2
                }! Angle: ${currentAngle.toFixed(0)}°`;
              }

              const p1Idx = landmarkNameToIndex[checkpoint.keypoint1];
              const p2Idx = landmarkNameToIndex[checkpoint.keypoint2];
              const p3Idx = landmarkNameToIndex[checkpoint.keypoint3];

              if (
                p1Idx !== undefined &&
                p2Idx !== undefined &&
                !connectionsToHighlightRed.some(
                  (c) => c[0] === p1Idx && c[1] === p2Idx
                )
              ) {
                connectionsToHighlightRed.push([p1Idx, p2Idx]);
              }
              if (
                p2Idx !== undefined &&
                p3Idx !== undefined &&
                !connectionsToHighlightRed.some(
                  (c) => c[0] === p2Idx && c[1] === p3Idx
                )
              ) {
                connectionsToHighlightRed.push([p2Idx, p3Idx]);
              }
              if (p1Idx !== undefined && !jointsToHighlightRed.includes(p1Idx))
                jointsToHighlightRed.push(p1Idx);
              if (p2Idx !== undefined && !jointsToHighlightRed.includes(p2Idx))
                jointsToHighlightRed.push(p2Idx);
              if (p3Idx !== undefined && !jointsToHighlightRed.includes(p3Idx))
                jointsToHighlightRed.push(p3Idx);
            }
          });

          const newReps = repCounterRef.current.detectRep(landmarksMap);
          if (newReps !== currentReps) {
            setCurrentReps(newReps);
            setFormFeedback("Great Rep!");
          } else if (overallFormCorrect && currentFrameFeedback === "") {
            setFormFeedback("Good form!");
          } else if (currentFrameFeedback !== "") {
            setFormFeedback(currentFrameFeedback);
          } else {
            setFormFeedback("Adjust your position.");
          }
        }

        // --- Drawing Logic ---
        drawConnectors(canvasCtx, mpLandmarks, POSE_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 4,
        });
        drawLandmarks(canvasCtx, mpLandmarks, {
          color: "#00FF00",
          lineWidth: 2,
        });

        connectionsToHighlightRed.forEach(([p1Idx, p2Idx]) => {
          drawConnectors(canvasCtx, mpLandmarks, [[p1Idx, p2Idx]], {
            color: "#FF0000",
            lineWidth: 4,
          });
        });

        const redLandmarksToDraw = mpLandmarks.filter((_, idx) =>
          jointsToHighlightRed.includes(idx)
        );
        if (redLandmarksToDraw.length > 0) {
          drawLandmarks(canvasCtx, redLandmarksToDraw, {
            color: "#FF0000",
            lineWidth: 2,
          });
        }
      }
      canvasCtx.restore();
    },
    [exercise, isWorkoutRunning, currentReps, landmarkNameToIndex]
  );

  // ... rest of the component (useEffect, handlers, return JSX) remains the same
  useEffect(() => {
    const currentVideoRef = videoRef.current;
    const currentCanvasRef = canvasRef.current;
    const currentContextRef = contextRef.current;
    const currentPoseRef = poseRef.current;
    const currentCameraRef = cameraRef.current;

    const fetchExercise = async () => {
      try {
        const res = await api.get<Exercise>(`/exercises/${exerciseId}`);
        setExercise(res.data);
        repCounterRef.current = new RepCounter(res.data.checkpoints);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching exercise:", err);
        setError(
          err.response?.data?.message || "Failed to load exercise details"
        );
        setLoading(false);
      }
    };

    if (exerciseId) {
      fetchExercise();
    } else {
      setError("No exercise ID provided.");
      setLoading(false);
    }

    if (!poseRef.current) {
      poseRef.current = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      poseRef.current.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      poseRef.current.onResults(onResults);
    }

    if (currentVideoRef && poseRef.current && !cameraRef.current) {
      cameraRef.current = new Camera(currentVideoRef, {
        onFrame: async () => {
          if (poseRef.current && currentVideoRef) {
            await poseRef.current.send({ image: currentVideoRef });
          }
        },
        width: 640,
        height: 480,
      });
      cameraRef.current.start();
    }

    return () => {
      if (currentCameraRef) {
        currentCameraRef.stop();
      }
      if (currentPoseRef) {
        currentPoseRef.close();
      }
      if (currentContextRef && currentCanvasRef) {
        currentContextRef.clearRect(
          0,
          0,
          currentCanvasRef.width,
          currentCanvasRef.height
        );
      }
    };
  }, [exerciseId, onResults]);

  useEffect(() => {
    if (canvasRef.current && videoRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
      contextRef.current = canvasRef.current.getContext("2d");
    }
  }, [videoRef.current?.videoWidth, videoRef.current?.videoHeight]);

  const startWorkout = () => {
    setIsWorkoutRunning(true);
    setCurrentReps(0);
    setFormFeedback("Workout started! Do your first rep.");
    if (repCounterRef.current) {
      repCounterRef.current.reset();
    }
  };

  const stopWorkout = () => {
    setIsWorkoutRunning(false);
    setFormFeedback("Workout finished!");
    console.log("Workout Summary:", {
      exerciseId: exercise?.name,
      duration: workoutDuration,
      totalReps: currentReps,
    });
  };

  const handleTimeUpdate = useCallback((seconds: number) => {
    setWorkoutDuration(seconds);
  }, [setWorkoutDuration]);

  if (loading)
    return (
      <div className="container mt-5">
        <p>Loading exercise...</p>
      </div>
    );
  if (error)
    return (
      <div className="container mt-5">
        <p className="text-danger">Error: {error}</p>
      </div>
    );
  if (!exercise)
    return (
      <div className="container mt-5">
        <p>Exercise not found.</p>
      </div>
    );

  return (
    <div className="container mt-5">
      <h1 className="mb-4">{exercise.name}</h1>
      <p>{exercise.description}</p>
      <p>Difficulty: {exercise.difficulty}</p>

      <div className="d-flex justify-content-center my-4">
        <div
          style={{
            position: "relative",
            width: "640px",
            height: "480px",
            border: "1px solid #ccc",
          }}
        >
          <video
            ref={videoRef}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            autoPlay
            playsInline
            muted
          ></video>
          <canvas
            ref={canvasRef}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          ></canvas>
        </div>
      </div>

      <div className="text-center my-3">
        <h3>Reps: {currentReps}</h3>
        <p className="lead">{formFeedback}</p>
        <WorkoutTimer
          isRunning={isWorkoutRunning}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <div className="text-center mt-4">
        {!isWorkoutRunning ? (
          <button
            className="btn btn-success btn-lg mx-2"
            onClick={startWorkout}
          >
            Start Workout
          </button>
        ) : (
          <button className="btn btn-danger btn-lg mx-2" onClick={stopWorkout}>
            Stop Workout
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkoutPage;