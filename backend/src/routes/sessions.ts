// backend/src/routes/sessions.ts

import { Router } from "express";
import { WorkoutSession } from "../models/Session";
import { Exercise } from "../models/Exercise";
import { protect } from "../middleware/auth";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// POST /api/sessions - Create a new workout session
router.post("/", protect, async (req: AuthRequest, res) => {
  try {
    const {
      exerciseId,
      duration,
      totalReps,
      correctReps,
      accuracy,
      repDetails,
      tierName,
    } = req.body;

    // FIX: Access req.user._id instead of req.user.id
    const userId = req.user?._id; // Corrected to _id based on your User model's primary key

    if (
      !userId ||
      !exerciseId ||
      duration === undefined ||
      totalReps === undefined ||
      !tierName
    ) {
      return res
        .status(400)
        .json({
          message:
            "Missing required session data (userId, exerciseId, duration, totalReps, tierName are mandatory).",
        });
    }

    const newSession = await WorkoutSession.create({
      userId: userId,
      exerciseId,
      sessionDate: new Date(),
      duration,
      totalReps,
      correctReps: correctReps || 0,
      accuracy: accuracy || 0,
      repDetails: repDetails || [],
      tierName,
    });

    res.status(201).json(newSession);
  } catch (error: any) {
    console.error("Error saving workout session:", error);
    res
      .status(500)
      .json({
        message: "Failed to save workout session",
        error: error.message,
      });
  }
});

// GET /api/sessions/user/:userId - Get all sessions for a specific user
router.get("/user/:userId", protect, async (req: AuthRequest, res) => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?._id;

    if (!authenticatedUserId || requestedUserId !== authenticatedUserId) {
      return res
        .status(403)
        .json({
          message: "Access denied: You can only view your own sessions.",
        });
    }

    const sessions = await WorkoutSession.findAll({
      where: { userId: requestedUserId },
      include: [{ model: Exercise, as: "exercise" }],
      order: [["sessionDate", "DESC"]],
    });
    res.status(200).json(sessions);
  } catch (error: any) {
    console.error("Error fetching user sessions:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch user sessions", error: error.message });
  }
});

// GET /api/sessions/user/:userId - Get all sessions for a specific user (for progress page)
router.get("/user/:userId", protect, async (req: AuthRequest, res) => {
  try {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.user?._id; // Get ID from authenticated user

    // Security check: Ensure the requested userId matches the authenticated user's ID
    if (!authenticatedUserId || requestedUserId !== authenticatedUserId) {
      return res
        .status(403)
        .json({
          message: "Access denied: You can only view your own sessions.",
        });
    }

    const sessions = await WorkoutSession.findAll({
      where: { userId: requestedUserId },
      include: [{ model: Exercise, as: "exercise" }], // Include exercise details
      order: [["sessionDate", "DESC"]],
    });
    res.status(200).json(sessions);
  } catch (error: any) {
    console.error("Error fetching user sessions:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch user sessions", error: error.message });
  }
});

export default router;
