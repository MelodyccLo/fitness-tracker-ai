import { sequelize } from '../config/database';
import { User } from './User';
import { Exercise } from './Exercise';
import { WorkoutSession } from './Session';

// Define associations here if any
// Example: User.hasMany(WorkoutSession, { foreignKey: 'userId' });
// WorkoutSession.belongsTo(User, { foreignKey: 'userId' });
// WorkoutSession.belongsTo(Exercise, { foreignKey: 'exerciseId' });


export { sequelize, User, Exercise, WorkoutSession };