// frontend/src/components/WorkoutPage.tsx

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "react-router-dom";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import {
  Landmark,
  calculateAngle,
  RepCounter,
  Exercise,
  getTierInfo,
} from "../utils/poseUtils";
import api from "../utils/api";
import { getUserIdFromToken } from "../utils/authUtils";

// Import new components
import CountdownOverlay from "./CountdownOverlay";
import WorkoutReport from "./WorkoutReport";
import TimerOverlay from "./TimerOverlay";
import ExerciseInfoOverlay from "./ExerciseInfoOverlay";

// Import the CSS file
import "../WorkoutPage.css";

interface WorkoutReportData {
  exerciseName: string;
  duration: number;
  totalReps: number;
  accuracy: number;
  completedAt: Date;
  tierName: string;
  tierMinReps: number; // NEW: Min reps of the achieved tier
  tierMaxReps: number | null; // NEW: Max reps of the achieved tier
}

const WorkoutPage: React.FC = () => {
  const { id: exerciseId } = useParams<{ id: string }>();
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const [isVideoElementReady, setIsVideoElementReady] = useState(false);
  const [isCanvasElementReady, setIsCanvasElementReady] = useState(false);

  const repCounterRef = useRef<RepCounter | null>(null);
  const currentRepsRef = useRef(0);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null); // State to capture camera access errors

  const [workoutPhase, setWorkoutPhase] = useState<
    "idle" | "countdown" | "active" | "completed"
  >("idle"); // 'idle' is the initial state before 'Start Workout'
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [cameraActive, setCameraActive] = useState(false); // Controls camera/canvas visibility
  const [showReport, setShowReport] = useState(false);
  const [workoutReport, setWorkoutReport] = useState<WorkoutReportData | null>(
    null
  );

  const [isWorkoutRunning, setIsWorkoutRunning] = useState(false);
  const [countdownWorkoutTime, setCountdownWorkoutTime] = useState(60);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [displayReps, setDisplayReps] = useState(0);
  const [displayFeedback, setDisplayFeedback] = useState(
    "Stand still to begin."
  );
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");

  const [currentTierName, setCurrentTierName] = useState<string>("");
  const [tierProgress, setTierProgress] = useState<number>(0);
  const [currentTierMinReps, setCurrentTierMinReps] = useState<number>(0);
  const [currentTierMaxReps, setCurrentTierMaxReps] = useState<number | null>(
    null
  );

  const landmarkNameToIndex = useMemo(() => {
    const map: { [key: string]: number } = {
      left_shoulder: 11,
      right_shoulder: 12,
      left_elbow: 13,
      right_elbow: 14,
      left_wrist: 15,
      right_wrist: 16,
      left_hip: 23,
      right_hip: 24,
      left_knee: 25,
      right_knee: 26,
      left_ankle: 27,
      right_ankle: 28,
    };
    return map;
  }, []);

  const onResults = useCallback(
    (results: Results) => {
      // Only process results if workout is active
      if (workoutPhase !== "active" || !exercise) {
        const canvasCtx = contextRef.current;
        const canvas = canvasElementRef.current;
        if (canvasCtx && canvas) {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }

      const canvasCtx = contextRef.current;
      const canvas = canvasElementRef.current;
      const video = videoElementRef.current;

      if (!canvasCtx || !canvas || !video || !exercise) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const imageWidth = results.image.width;
      const imageHeight = results.image.height;

      if (canvas.width !== imageWidth || canvas.height !== imageHeight) {
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        console.log(
          `Canvas resized to match image: ${imageWidth}x${imageHeight}`
        );
      }

      canvasCtx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
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
        if (repCounterRef.current && isWorkoutRunning) {
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

            // Calculate the angle between the three points
            if (!p1 || !p2 || !p3) return;
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
          // If form is correct, update reps and feedback
          const newReps = repCounterRef.current.detectRep(landmarksMap);
          if (newReps !== currentRepsRef.current) {
            currentRepsRef.current = newReps;
            setDisplayReps(newReps);
            setDisplayFeedback("Great Rep!");
          } else if (overallFormCorrect && currentFrameFeedback === "") {
            setDisplayFeedback("Good form!");
          } else if (currentFrameFeedback !== "") {
            setDisplayFeedback(currentFrameFeedback);
          } else {
            setDisplayFeedback("Adjust your position.");
          }

          if (exercise.tiers && exercise.tiers.length > 0) {
            const tierInfo = getTierInfo(
              currentRepsRef.current,
              exercise.tiers
            );
            setCurrentTierName(tierInfo.currentTierName);
            setTierProgress(tierInfo.progressInTier);
            setCurrentTierMinReps(tierInfo.tierMinReps);
            setCurrentTierMaxReps(tierInfo.tierMaxReps);
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
    [workoutPhase, exercise, landmarkNameToIndex, isWorkoutRunning]
  );

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    if (exerciseId) {
      fetchExercise();
    } else {
      setError("No exercise ID provided.");
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    // MediaPipe & Camera Setup useEffect logic only runs if cameraActive is true
    // This is controlled by handleStartClick now
    if (!cameraActive) {
      // If the component mounts and camera is not active, ensure previous stream is stopped
      const videoElement = videoElementRef.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }
      return; // Exit early if camera is not active (and cleanup if it was active and turned off)
    }

    // Only proceed with camera initialization if cameraActive is true
    console.log("Unified MediaPipe & Camera Setup useEffect: Running.");

    const videoElement = videoElementRef.current;
    const canvasElement = canvasElementRef.current;
    let ctx: CanvasRenderingContext2D | null = null;

    if (
      !isVideoElementReady ||
      !isCanvasElementReady ||
      !videoElement ||
      !canvasElement
    ) {
      console.log(
        "Unified MediaPipe & Camera Setup useEffect: Waiting for refs.",
        {
          isVideoElementReady,
          isCanvasElementReady,
          video: videoElement,
          canvas: canvasElement,
          context: ctx,
        }
      );
      return () => {
        console.log(
          "Unified MediaPipe & Camera Setup useEffect: No setup to clean up (refs not ready)."
        );
      };
    }

    console.log(
      "Unified MediaPipe & Camera Setup useEffect: All refs and state confirm mount. Proceeding with setup."
    );
    ctx = canvasElement.getContext("2d");
    if (ctx) {
      contextRef.current = ctx;
      console.log("Canvas context successfully initialized.");
    } else {
      console.error("Failed to get 2D context from canvas. Cannot proceed.");
      setError("Your browser does not support canvas 2D rendering.");
      setCameraError("Your browser does not support canvas 2D rendering.");
      return;
    }

    canvasElement.width = videoElement.videoWidth || 640;
    canvasElement.height = videoElement.videoHeight || 480;
    console.log("Canvas initial dimensions set.");

    console.log("Initializing Pose model.");
    let pose: Pose | null = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(onResults);
    console.log("Pose model initialized and onResults bound.");
    console.log("Attempting to get media stream and setup custom frame loop.");
    let frameId: number | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then((stream) => {
        videoElement.srcObject = stream;
        videoElement.onloadedmetadata = () => {
          videoElement.play();
          const currentPose = pose;
          const currentVideo = videoElement;

          const sendFrameToPose = async () => {
            if (currentVideo.readyState === 4 && currentPose) {
              try {
                await currentPose.send({ image: currentVideo });
              } catch (e: any) {
                console.warn(
                  "Error sending image to pose model, likely cleanup in progress:",
                  e.message
                );
                if (e.message.includes("deleted object") && frameId !== null) {
                  cancelAnimationFrame(frameId);
                  frameId = null;
                  console.log(
                    "Stopped sending frames due to deleted pose model."
                  );
                }
              }
            }
            if (frameId !== null) {
              frameId = requestAnimationFrame(sendFrameToPose);
            }
          };
          frameId = requestAnimationFrame(sendFrameToPose);
          console.log("Camera stream started and frame loop initiated.");
        };
        console.log("getUserMedia resolved: Video stream acquired.");
      })
      .catch((err) => {
        console.error("Failed to get video stream:", err);
        let errorMessage = "Camera access failed.";
        if (err.name === "NotAllowedError") {
          errorMessage +=
            " Please allow camera permissions and refresh the page.";
        } else if (err.name === "NotFoundError") {
          errorMessage +=
            " No camera found. Please connect a camera and try again.";
        } else {
          errorMessage += " Please check your camera and try again.";
        }
        setCameraError(errorMessage);
        setError(errorMessage);
      });
    return () => {
      console.log(
        "Unified MediaPipe & Camera Setup useEffect: Cleanup running."
      );
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
        frameId = null;
        console.log("Cleanup: Animation frame loop canceled.");
      }

      if (videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
        console.log("Cleanup: Video stream tracks stopped.");
      }
      if (pose) {
        console.log("Cleanup: Closing Pose model.");
        pose.close();
      }

      if (ctx && canvasElement) {
        console.log("Cleanup: Clearing canvas.");
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      }
    };
  }, [onResults, isVideoElementReady, isCanvasElementReady, cameraActive]); // Re-run effect when cameraActive changes

  const stopWorkout = useCallback(
    async (isEarlyExit: boolean) => {
      setIsWorkoutRunning(false);
      setWorkoutPhase("completed");
      setCameraActive(false); // Turn off camera display

      const videoElement = videoElementRef.current;
      if (videoElement && videoElement.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoElement.srcObject = null;
      }

      if (isEarlyExit) {
        setWarningMessage(
          "Workout ended early! Your fitness test results will not be saved due to incomplete duration."
        );
        setShowWarning(true);
        setShowReport(false);
        setWorkoutReport(null);
      } else {
        const report: WorkoutReportData = {
          exerciseName: exercise?.name || "Unknown",
          duration: workoutDuration,
          totalReps: displayReps,
          accuracy: 0,
          completedAt: new Date(),
          tierName: currentTierName,
          tierMinReps: currentTierMinReps,
          tierMaxReps: currentTierMaxReps,
        };
        setWorkoutReport(report);
        setShowReport(true);
        setShowWarning(false);
        setWarningMessage("");

        if (exercise && exerciseId) {
          const userId = getUserIdFromToken();

          if (!userId) {
            console.error(
              "User not authenticated. Cannot save workout session."
            );
            return;
          }

          try {
            const sessionData = {
              userId: userId,
              exerciseId: exerciseId,
              sessionDate: new Date(),
              duration: workoutDuration,
              totalReps: displayReps,
              correctReps: displayReps,
              accuracy: 0,
              repDetails: [],
              tierName: currentTierName,
            };

            await api.post("/sessions", sessionData);
            console.log("Workout session saved successfully!");
          } catch (saveError: any) {
            console.error(
              "Failed to save workout session:",
              saveError.response?.data?.message || saveError.message
            );
          }
        }
      }
    },
    [
      exercise,
      workoutDuration,
      displayReps,
      currentTierName,
      exerciseId,
      currentTierMinReps,
      currentTierMaxReps,
    ]
  );

  const handleCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setWorkoutPhase("active");
    setIsWorkoutRunning(true);
    currentRepsRef.current = 0;
    setDisplayReps(0);
    setDisplayFeedback("Workout started! Do your first rep.");
    if (repCounterRef.current) {
      repCounterRef.current.reset();
    }
    setCountdownWorkoutTime(60);
    if (exercise && exercise.tiers && exercise.tiers.length > 0) {
      const initialTierInfo = getTierInfo(0, exercise.tiers);
      setCurrentTierName(initialTierInfo.currentTierName);
      setTierProgress(initialTierInfo.progressInTier);
      setCurrentTierMinReps(initialTierInfo.tierMinReps);
      setCurrentTierMaxReps(initialTierInfo.tierMaxReps);
    }
  }, [
    setIsWorkoutRunning,
    setWorkoutPhase,
    setDisplayReps,
    setDisplayFeedback,
    setCountdownWorkoutTime,
    exercise,
  ]);

  const handleTimeUpdate = useCallback(
    (seconds: number) => {
      if (workoutPhase === "active") {
        setCountdownWorkoutTime(seconds);
        setWorkoutDuration(seconds);

        if (seconds <= 0) {
          stopWorkout(false);
        }
      }
    },
    [workoutPhase, setWorkoutDuration, stopWorkout, setCountdownWorkoutTime]
  );

  useEffect(() => {
    let countdownInterval: number | undefined;
    if (workoutPhase === "countdown" && showCountdown) {
      countdownInterval = window.setInterval(() => {
        setCountdownValue((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            handleCountdownComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [workoutPhase, showCountdown, handleCountdownComplete]);

  const handleStartClick = () => {
    if (workoutPhase === "idle") {
      setCameraActive(true); // Activate camera immediately on start
      setWorkoutPhase("countdown"); // Move directly to countdown
      setShowCountdown(true);
      setCountdownValue(3);
    }
  };

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
    <div className="container-fluid" style={{ padding: 0 }}>
      {/* --- Initial Idle State: Show Exercise Info and Start Button --- */}
      {workoutPhase === "idle" && (
        <div className="text-left p-4">
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--heading-color)",
            }}
          >
            {exercise.name}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-color)",
            }}
          >
            {exercise.description}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-color)",
            }}
          >
            <strong>Target Muscles:</strong> {exercise.targetMuscles.join(", ")}
          </p>
          <p
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-color)",
            }}
          >
            <strong>Difficulty:</strong> {exercise.difficulty}
          </p>
          <h4
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--heading-color)",
              marginTop: "20px",
            }}
          >
            Instructions:
          </h4>
          <ul
            style={{
              fontFamily: "var(--font-body)",
              color: "var(--text-color)",
              listStyleType: "disc",
              display: "inline-block",
              textAlign: "left",
              marginLeft: "20px",
            }}
          >
            {exercise.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ul>
          {cameraError && (
            <p className="text-danger mt-3">
              <strong>Camera Error:</strong> {cameraError} Please allow camera
              permissions or check your camera.
            </p>
          )}
          <div className="start-workout-button-container">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStartClick}
              style={{ minWidth: "200px" }}
              disabled={!!cameraError}
            >
              Start Workout
            </button>
          </div>
        </div>
      )}

      {/* --- Active/Countdown/Completed States: Show Camera Area & Overlays --- */}
      {/* The camera-container is ONLY rendered if workoutPhase is NOT idle */}
      {workoutPhase !== "idle" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            minHeight: "calc(100vh - 300px)", // Adjust 80px to your navbar's height
          }}
        >
          <div className="camera-container">
            {/* 'X' Overlay Button */}
            {workoutPhase === "active" && (
              <button
                onClick={() => stopWorkout(true)}
                className="stop-test-button"
              >
                &#x2715;
              </button>
            )}

            {/* Video and Canvas elements */}
            <video
              ref={(el) => {
                videoElementRef.current = el;
                if (el) setIsVideoElementReady(true);
                else setIsVideoElementReady(false);
              }}
              autoPlay
              playsInline
              muted
              style={{ display: cameraActive ? "block" : "none" }}
            ></video>
            <canvas
              ref={(el) => {
                canvasElementRef.current = el;
                if (el) setIsCanvasElementReady(true);
                else setIsCanvasElementReady(false);
              }}
              style={{ display: cameraActive ? "block" : "none" }}
            ></canvas>

            {/* Overlays */}
            <CountdownOverlay
              value={countdownValue}
              onComplete={handleCountdownComplete}
              show={showCountdown}
            />
            <TimerOverlay
              isRunning={isWorkoutRunning}
              seconds={countdownWorkoutTime}
              show={workoutPhase === "active"}
              onTimeUpdate={handleTimeUpdate}
              isCountdown={true}
            />
            <ExerciseInfoOverlay
              reps={displayReps}
              feedback={displayFeedback}
              show={workoutPhase === "active"}
            />

            {/* UI FOR TIER AND METER */}
            {workoutPhase === "active" && currentTierName && (
              <div
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(0,0,0,0.7)",
                  color: "#fff",
                  padding: "10px 20px",
                  borderRadius: "25px",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  zIndex: 10,
                  textAlign: "center",
                  minWidth: "180px",
                }}
              >
                {currentTierName}
                {tierProgress !== null && (
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "#333",
                      borderRadius: "4px",
                      marginTop: "5px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${tierProgress * 100}%`,
                        height: "100%",
                        transition: "width 0.2s ease-out",
                      }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Message Overlay */}
      {showWarning && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 0, 0, 0.8)",
            color: "#fff",
            padding: "30px",
            borderRadius: "15px",
            fontSize: "1.2 rem",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: 100,
            maxWidth: "80%",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
          }}
        >
          <p>{warningMessage}</p>
          <button
            className="btn btn-light mt-3"
            onClick={() => {
              setShowWarning(false);
              setWorkoutPhase("idle");
              setCameraActive(false);
              setWorkoutReport(null);
              setDisplayReps(0);
              setDisplayFeedback("Stand still to begin.");
              setWorkoutDuration(0);
              setCountdownWorkoutTime(60);
              setCurrentTierName("");
              setTierProgress(0);
              setCurrentTierMinReps(0);
              setCurrentTierMaxReps(null);
            }}
          >
            OK
          </button>
        </div>
      )}

      {/* Workout Report Modal (only shows if 'showReport' is true) */}
      <WorkoutReport
        report={workoutReport}
        onClose={() => {
          setShowReport(false);
          setWorkoutPhase("idle");
          setCameraActive(false);
          setWorkoutReport(null);
          setDisplayReps(0);
          setDisplayFeedback("Stand still to begin.");
          setWorkoutDuration(0);
          setCountdownWorkoutTime(60);
          setCurrentTierName("");
          setTierProgress(0);
          setCurrentTierMinReps(0);
          setCurrentTierMaxReps(null);
        }}
        show={showReport}
      />
    </div>
  );
};

export default WorkoutPage;
