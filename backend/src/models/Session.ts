import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Exercise } from './Exercise';

interface RepDetail {
  repNumber: number;
  angles: number[];
  accuracy: number;
  timestamp: number;
}

interface WorkoutSessionAttributes {
  _id: string;
  userId: string;
  exerciseId: string;
  sessionDate: Date;
  duration: number;
  totalReps: number;
  correctReps: number;
  accuracy: number;
  repDetails: RepDetail[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface WorkoutSessionCreationAttributes extends Optional<WorkoutSessionAttributes, '_id' | 'createdAt' | 'updatedAt'> {}

export class WorkoutSession extends Model<WorkoutSessionAttributes, WorkoutSessionCreationAttributes> implements WorkoutSessionAttributes {
  public _id!: string;
  public userId!: string;
  public exerciseId!: string;
  public sessionDate!: Date;
  public duration!: number;
  public totalReps!: number;
  public correctReps!: number;
  public accuracy!: number;
  public repDetails!: RepDetail[];

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

WorkoutSession.init(
  {
    _id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: User, // Reference the User model
        key: '_id',
      },
    },
    exerciseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Exercise, // Reference the Exercise model
        key: '_id',
      },
    },
    sessionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalReps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    correctReps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    accuracy: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    repDetails: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    sequelize,
    tableName: 'workout_sessions',
    timestamps: true,
  }
);

// Define associations after models are initialized
User.hasMany(WorkoutSession, { foreignKey: 'userId', as: 'sessions' });
WorkoutSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Exercise.hasMany(WorkoutSession, { foreignKey: 'exerciseId', as: 'sessions' });
WorkoutSession.belongsTo(Exercise, { foreignKey: 'exerciseId', as: 'exercise' });