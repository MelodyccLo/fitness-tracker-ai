import { Router, Request, Response } from "express";
import { Exercise } from "../models/Exercise";
import { protect } from "../middleware/auth";

const router = Router();

// @route   GET /api/exercises
// @desc    Get all exercises
// @access  Public (or Private, if only authenticated users can see exercises)
router.get("/", async (req: Request, res: Response) => {
  try {
    const exercises = await Exercise.findAll();
    res.json(exercises);
  } catch (error: unknown) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/exercises/:id
// @desc    Get specific exercise by ID
// @access  Public (or Private)
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const exercise = await Exercise.findByPk(req.params.id);
    if (exercise) {
      res.json(exercise);
    } else {
      res.status(404).json({ message: "Exercise not found" });
    }
  } catch (error: unknown) {
    console.error("Error fetching exercise:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/exercises
// @desc    Create a new exercise (requires admin/auth in a real app)
// @access  Private (e.g., use 'protect' middleware)
// For now, let's make it public for easier testing during development
router.post("/", async (req: Request, res: Response) => {
  const {
    name,
    description,
    targetMuscles,
    checkpoints,
    instructions,
    difficulty,
  } = req.body;

  // Basic validation
  if (!name || !checkpoints) {
    return res
      .status(400)
      .json({ message: "Name and checkpoints are required" });
  }

  try {
    const newExercise = await Exercise.create({
      name,
      description,
      targetMuscles,
      checkpoints,
      instructions,
      difficulty,
    });
    res.status(201).json(newExercise);
  } catch (error: any) {
    // Use 'any' temporarily if specific Sequelize validation error types are complex
    console.error("Error creating exercise:", error);
    // Handle unique constraint errors if name must be unique
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "Exercise with this name already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// You can add PUT/DELETE routes for exercises later if needed

export default router;
