// Define a type for MediaPipe Landmark points
export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

/**
 * Calculates the angle (in degrees) between three 2D points.
 * Point2 is the vertex of the angle.
 */
export function calculateAngle(
  point1: Landmark,
  point2: Landmark,
  point3: Landmark
): number {
  // Vectors from point2 to point1 and point2 to point3
  const vector1 = [point1.x - point2.x, point1.y - point2.y];
  const vector2 = [point3.x - point2.x, point3.y - point2.y];

  // Calculate dot product
  const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
  const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);

  // Avoid division by zero
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  // Calculate angle in radians using arccosine
  // Clamp the argument to acos to prevent NaN due to floating point inaccuracies
  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angleRad = Math.acos(Math.min(1, Math.max(-1, cosAngle)));

  // Convert to degrees
  const angleDeg = angleRad * (180 / Math.PI);
  return angleDeg;
}

// Interface for an exercise checkpoint (as defined in your backend Exercise model)
export interface ExerciseCheckpoint {
  keypoint1: string;
  keypoint2: string;
  keypoint3: string;
  targetAngle: number;
  tolerance: number;
  phase: "up" | "down";
}

// NEW: Define the ExerciseTier interface for the frontend
export interface ExerciseTier {
  name: string;
  minReps: number;
  maxReps: number | null;
}

// NEW: Interface for Exercise (consistent with your backend model, now including tiers)
export interface Exercise {
  _id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  checkpoints: ExerciseCheckpoint[];
  instructions: string[];
  difficulty: string;
  tiers: ExerciseTier[];
}

// NEW FUNCTION: getTierInfo
export function getTierInfo(
  currentReps: number,
  tiers: ExerciseTier[]
): {
  currentTierName: string;
  tierMinReps: number;
  tierMaxReps: number | null;
  progressInTier: number; // 0 to 1, representing progress within the current tier's range
} {
  let currentTier: ExerciseTier | null = null;
  let nextTierMinReps: number | null = null;

  // Sort tiers by minReps to ensure correct processing, especially if definition order isn't guaranteed
  // (though typically they'd be defined in ascending order)
  const sortedTiers = [...tiers].sort((a, b) => a.minReps - b.minReps);

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    // Check if currentReps falls within this tier's range
    // Handles 'null' for maxReps for the highest tier
    if (
      currentReps >= tier.minReps &&
      (tier.maxReps === null || currentReps <= tier.maxReps)
    ) {
      currentTier = tier;
      // If there's a next tier, get its minReps to help calculate progress for the current tier
      if (i + 1 < sortedTiers.length) {
        nextTierMinReps = sortedTiers[i + 1].minReps;
      }
      break; // Found the current tier
    }
  }

  // Handle cases where no tier is matched (e.g., negative reps, or data issues)
  // Or if reps are below the first tier's minReps (though minReps usually starts at 0)
  if (!currentTier) {
    // Default to the first tier if reps are below its minReps but positive
    if (
      sortedTiers.length > 0 &&
      currentReps < sortedTiers[0].minReps &&
      currentReps >= 0
    ) {
      currentTier = sortedTiers[0];
      if (sortedTiers.length > 1) {
        nextTierMinReps = sortedTiers[1].minReps;
      }
    } else {
      // Fallback for unexpected cases, or if tiers array is empty
      return {
        currentTierName: "N/A",
        tierMinReps: 0,
        tierMaxReps: 0,
        progressInTier: 0,
      };
    }
  }

  // Calculate progress within the current tier
  let progressInTier = 0;
  if (currentTier.maxReps === null) {
    // For the highest tier ("Elite"), progress is always 1 (100%)
    // or you could calculate it against the previous tier's max to show "how far past"
    // For simplicity, let's say 100% once you hit the elite tier.
    progressInTier = 1;
  } else {
    const tierRange = currentTier.maxReps - currentTier.minReps;
    if (tierRange > 0) {
      progressInTier = (currentReps - currentTier.minReps) / tierRange;
      progressInTier = Math.min(1, Math.max(0, progressInTier)); // Clamp between 0 and 1
    } else {
      // This case means minReps === maxReps, typically a single-rep tier, so progress is 1 if in it.
      progressInTier = 1;
    }
  }

  return {
    currentTierName: currentTier.name,
    tierMinReps: currentTier.minReps,
    tierMaxReps: currentTier.maxReps,
    progressInTier: progressInTier,
  };
}

// Class to manage rep detection state for a single exercise
export class RepCounter {
  private inDownPhase: boolean = false;
  private inUpPhase: boolean = false;
  private repCount: number = 0;
  private currentCheckpoints: ExerciseCheckpoint[] = [];
  constructor(checkpoints: ExerciseCheckpoint[]) {
    this.currentCheckpoints = checkpoints;
  }

  public reset() {
    this.inDownPhase = false;
    this.inUpPhase = false;
    this.repCount = 0;
  }

  public getRepCount(): number {
    return this.repCount;
  }

  /**
   * Processes a new frame's pose data to detect reps.
   * Call this for each relevant checkpoint.
   * @returns The current rep count after processing this frame.
   */
  public detectRep(keypoints: { [key: string]: Landmark }): number {
    let allDownCheckpointsMet = true;
    let allUpCheckpointsMet = true;

    // Check each checkpoint for the current phase
    this.currentCheckpoints.forEach((checkpoint) => {
      const p1 = keypoints[checkpoint.keypoint1];
      const p2 = keypoints[checkpoint.keypoint2];
      const p3 = keypoints[checkpoint.keypoint3];

      if (!p1 || !p2 || !p3) {
        // Cannot calculate angle if keypoints are missing
        if (checkpoint.phase === "down") allDownCheckpointsMet = false;
        if (checkpoint.phase === "up") allUpCheckpointsMet = false;
        return;
      }

      const currentAngle = calculateAngle(p1, p2, p3);
      const isInRange =
        Math.abs(currentAngle - checkpoint.targetAngle) <= checkpoint.tolerance;

      if (checkpoint.phase === "down" && !isInRange) {
        allDownCheckpointsMet = false;
      }
      if (checkpoint.phase === "up" && !isInRange) {
        allUpCheckpointsMet = false;
      }
    });

    // Rep detection logic
    if (allDownCheckpointsMet && !this.inDownPhase) {
      this.inDownPhase = true;
      this.inUpPhase = false; // Reset up phase as we are now in down
    } else if (allUpCheckpointsMet && this.inDownPhase && !this.inUpPhase) {
      this.inUpPhase = true;
      this.repCount++;
      this.inDownPhase = false; // Reset down phase as we just completed a rep
    }

    return this.repCount;
  }
}
