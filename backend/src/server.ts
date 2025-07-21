import express from 'express'; 
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import { sequelize } from './models';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('common'));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Connect to DB and then start server
sequelize.sync().then(() => {
  console.log('Database synced (tables created/updated).');
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(error => {
  console.error("Failed to start server due to database sync error:", error);
  process.exit(1);
});