import { Router, Request, Response } from "express";
import { User } from "../models/User";
import jwt from "jsonwebtoken";
import { protect, AuthRequest } from "../middleware/auth";

const router = Router();

// Helper function to generate JWT
const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
    expiresIn: "1h", // Token expires in 1 hour
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", async (req: Request, res: Response) => {
  const { username, email, password, age, height, weight, fitnessLevel } =
    req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ where: { email } });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    user = await User.create({
      username,
      email,
      password,
      age,
      height,
      weight,
      fitnessLevel,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get("/profile", protect, async (req: Request, res: Response) => {
  // The 'protect' middleware adds the user to req.user
  const user = (req as any).user; // Cast req to any to access user property

  if (user) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      age: user.age,
      height: user.height,
      weight: user.weight,
      fitnessLevel: user.fitnessLevel,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put("/profile", protect, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id; // Get user ID from authenticated request

    if (!userId) {
      return res
        .status(401)
        .json({ message: "Not authorized, user ID missing" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { age, height, weight, fitnessLevel } = req.body;

    // Update fields if provided in the request body
    if (age !== undefined) user.age = age;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;
    if (fitnessLevel !== undefined) user.fitnessLevel = fitnessLevel;

    await user.save(); // Save changes to the database

    // Return updated user profile (excluding password)
    const { password, ...updatedUserProfileWithoutPassword } = user.toJSON();

    res.status(200).json(updatedUserProfileWithoutPassword);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "Server error updating profile", error: error.message });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Public
router.post("/logout", (req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
