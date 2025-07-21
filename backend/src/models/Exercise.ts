import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface Checkpoint {
  keypoint1: string; // e.g., "left shoulder"
  keypoint2: string; // e.g., "left elbow"
  keypoint3: string; // e.g., "left wrist"
  targetAngle: number;
  tolerance: number;
  phase: 'up' | 'down';
}

interface ExerciseAttributes {
  _id: string;
  name: string;
  description: string;
  targetMuscles: string[];
  checkpoints: Checkpoint[];
  instructions: string[];
  difficulty: string; 
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
      type: DataTypes.JSONB, // Store as JSONB for complex nested data [cite: 51]
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
  },
  {
    sequelize,
    tableName: 'exercises',
    timestamps: true,
  }
);