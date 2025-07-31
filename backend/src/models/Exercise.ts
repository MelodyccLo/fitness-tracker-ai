import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface Checkpoint {
  keypoint1: string;
  keypoint2: string;
  keypoint3: string;
  targetAngle: number;
  tolerance: number;
  phase: 'up' | 'down';
}

// NEW: Define the ExerciseTier interface
interface ExerciseTier {
  name: string;      // e.g., "Beginner", "Developing", "Competent", "Proficient", "Elite"
  minReps: number;   // Minimum reps for this tier
  maxReps: number | null; // Maximum reps for this tier. null for the highest tier.
}

interface ExerciseAttributes {
  _id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  checkpoints: Checkpoint[];
  instructions: string[];
  difficulty: string;
  tiers: ExerciseTier[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExerciseCreationAttributes extends Optional<ExerciseAttributes, '_id' | 'createdAt' | 'updatedAt'> {}

export class Exercise extends Model<ExerciseAttributes, ExerciseCreationAttributes> implements ExerciseAttributes {
  public _id!: string;
  public name!: string;
  public description!: string;
  public targetMuscles!: string[];
  public checkpoints!: Checkpoint[];
  public instructions!: string[];
  public difficulty!: string;
  public tiers!: ExerciseTier[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Exercise.init(
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
    },
    targetMuscles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    checkpoints: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    instructions: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    difficulty: {
      type: DataTypes.STRING,
    },
    // NEW: Add the tiers column definition
    tiers: {
      type: DataTypes.JSONB, // Store as JSONB
      allowNull: false,      // Tiers should always be defined for an exercise
      defaultValue: [],      // Default to an empty array
    },
  },
  {
    sequelize,
    tableName: 'exercises',
    timestamps: true,
  }
);