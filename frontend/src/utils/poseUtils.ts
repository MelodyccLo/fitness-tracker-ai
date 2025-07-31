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
  const vector1 = [point1.x - point2.x, point1.y - point2.y];
  const vector2 = [point3.x - point2.x, point3.y - point2.y];

  const dotProduct = vector1[0] * vector2[0] + vector1[1] * vector2[1];
  const magnitude1 = Math.sqrt(vector1[0] ** 2 + vector1[1] ** 2);
  const magnitude2 = Math.sqrt(vector2[0] ** 2 + vector2[1] ** 2);
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  const cosAngle = dotProduct / (magnitude1 * magnitude2);
  const angleRad = Math.acos(Math.min(1, Math.max(-1, cosAngle)));

  const angleDeg = angleRad * (180 / Math.PI);
  return angleDeg;
}

export interface ExerciseCheckpoint {
  keypoint1: string;
  keypoint2: string;
  keypoint3: string;
  targetAngle: number;
  tolerance: number;
  phase: "up" | "down";
}

export interface ExerciseTier {
  name: string;
  minReps: number;
  maxReps: number | null;
}

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

export function getTierInfo(
  currentReps: number,
  tiers: ExerciseTier[]
): {
  currentTierName: string;
  tierMinReps: number;
  tierMaxReps: number | null;
  progressInTier: number;
} {
  let currentTier: ExerciseTier | null = null;

  const sortedTiers = [...tiers].sort((a, b) => a.minReps - b.minReps);

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    if (
      currentReps >= tier.minReps &&
      (tier.maxReps === null || currentReps <= tier.maxReps)
    ) {
      currentTier = tier;
      break;
    }
  }

  if (!currentTier) {
    if (
      sortedTiers.length > 0 &&
      currentReps < sortedTiers[0].minReps &&
      currentReps >= 0
    ) {
      currentTier = sortedTiers[0];
    } else {
      return {
        currentTierName: "N/A",
        tierMinReps: 0,
        tierMaxReps: 0,
        progressInTier: 0,
      };
    }
  }

  let progressInTier = 0;
  if (currentTier.maxReps === null) {
    progressInTier = 1;
  } else {
    const tierRange = currentTier.maxReps - currentTier.minReps;
    if (tierRange > 0) {
      progressInTier = (currentReps - currentTier.minReps) / tierRange;
      progressInTier = Math.min(1, Math.max(0, progressInTier));
    } else {
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

  public detectRep(keypoints: { [key: string]: Landmark }): number {
    let allDownCheckpointsMet = true;
    let allUpCheckpointsMet = true;

    this.currentCheckpoints.forEach((checkpoint) => {
      const p1 = keypoints[checkpoint.keypoint1];
      const p2 = keypoints[checkpoint.keypoint2];
      const p3 = keypoints[checkpoint.keypoint3];

      if (!p1 || !p2 || !p3) {
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

    if (allDownCheckpointsMet && !this.inDownPhase) {
      this.inDownPhase = true;
      this.inUpPhase = false;
    } else if (allUpCheckpointsMet && this.inDownPhase && !this.inUpPhase) {
      this.inUpPhase = true;
      this.repCount++;
      this.inDownPhase = false;
    }

    return this.repCount;
  }
}
