import express from 'express'; 
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import exercisesRoutes from './routes/exercisesRoutes';
import sessionsRoutes from './routes/sessions';
import { sequelize } from './models';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('common'));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/sessions', sessionsRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});


sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced (tables created/updated).');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error("Failed to start server due to database sync error:", error);
  process.exit(1);
});