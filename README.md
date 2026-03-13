# Fitness Tracker AI

A full-stack AI-powered fitness tracking application that uses real-time pose detection to guide users through exercises with proper form. Built with React, Node.js/Express, and PostgreSQL, with MediaPipe providing intelligent movement analysis.

## Tech Stack

| Layer     | Technology                                                    |
|-----------|---------------------------------------------------------------|
| Frontend  | React 19 (TypeScript), React Router, Bootstrap 5, Chart.js   |
| AI/Vision | MediaPipe Pose, Camera Utils, Drawing Utils                   |
| Backend   | Node.js, Express.js, TypeScript                               |
| Database  | PostgreSQL, Sequelize ORM                                     |
| Auth      | JWT, bcryptjs, Helmet                                         |
| HTTP      | Axios, CORS, Morgan                                           |

## Features

- **Real-time pose detection** -- MediaPipe tracks body landmarks during workouts, providing live feedback on exercise form and accuracy.
- **Tier-based progression** -- Users advance through tiers (Beginner to Elite) based on rep count and performance, keeping workouts engaging.
- **Workout session tracking** -- Rep counters, timers, and accuracy metrics are recorded for every session.
- **Interactive dashboard** -- Chart.js visualizations display workout history, progress trends, and performance metrics.
- **Exercise library** -- Configurable exercises with pose checkpoints, target muscles, difficulty levels, and step-by-step instructions.
- **User authentication** -- Secure registration and login with JWT tokens and hashed passwords.
- **User profiles** -- Track personal fitness metrics including age, height, weight, and fitness level.
- **Protected routes** -- Private route wrappers ensure authenticated access to user-specific pages.

## Architecture

```
Client (React + MediaPipe)
    |
    | Axios / REST
    v
Server (Express.js + JWT Auth)
    |
    | Sequelize ORM
    v
PostgreSQL Database
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL
- npm

### Environment Setup

Create a `.env` file in the `backend/` directory:

```
PORT=5001
DB_CONNECTION=postgres://user:password@localhost:5432/fitness_tracker
JWT_SECRET=your_secret_key
```

### Installation

```bash
# Clone the repository
git clone https://github.com/MelodyccLo/fitness-tracker-ai.git
cd fitness-tracker-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the Application

```bash
# Start the backend (from backend/)
npm run dev

# Start the frontend (from frontend/)
npm start
```

The backend runs on `http://localhost:5001` and the frontend on `http://localhost:3000`.

## API Endpoints

### Authentication
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | `/api/auth/register`  | Register a new user  |
| POST   | `/api/auth/login`     | Login and get token  |
| GET    | `/api/auth/profile`   | Get user profile     |

### Exercises
| Method | Endpoint              | Description            |
|--------|-----------------------|------------------------|
| GET    | `/api/exercises`      | List all exercises     |
| GET    | `/api/exercises/:id`  | Get exercise details   |

### Sessions
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/sessions`       | Create a workout session |
| GET    | `/api/sessions`       | Get session history      |

## Database Schema

| Table              | Key Columns                                                        |
|--------------------|--------------------------------------------------------------------|
| **users**          | id (UUID), username, email, password, age, height, weight, fitness_level |
| **exercises**      | id (UUID), name, description, target_muscles, checkpoints, tiers, difficulty |
| **workout_sessions** | id (UUID), user_id, exercise_id, reps, duration, accuracy        |

## Project Structure

```
fitness-tracker-ai/
├── backend/
│   └── src/
│       ├── server.ts              # Express server entry point
│       ├── config/database.ts     # PostgreSQL connection
│       ├── middleware/auth.ts     # JWT authentication
│       ├── models/               # Sequelize models (User, Exercise, Session)
│       └── routes/               # API route handlers
└── frontend/
    └── src/
        ├── App.tsx                # Router and layout
        ├── components/
        │   ├── Dashboard.tsx      # Charts and progress overview
        │   ├── WorkoutPage.tsx    # MediaPipe pose detection
        │   ├── ExerciseSelection.tsx
        │   ├── WorkoutReport.tsx
        │   ├── ProfilePage.tsx
        │   └── auth/             # Login and Register
        └── utils/
            ├── api.ts             # Axios HTTP client
            ├── authUtils.ts       # Token management
            └── poseUtils.ts       # MediaPipe pose logic
```
