import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home"; // Assuming Home is your public landing page
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ExerciseSelection from "./components/ExerciseSelection";
import Dashboard from "./components/Dashboard"; // Dashboard will now effectively be the Home page
import ProfilePage from "./components/ProfilePage"; // NEW: Import ProfilePage
import PrivateRoute from "./components/PrivateRoute";
import WorkoutPage from "./components/WorkoutPage";
import Navbar from "./components/layout/Navbar";

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {" "}
        {/* Added container for consistent padding, adjust as needed */}
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />{" "}
          {/* Public Home, e.g., landing page */}
          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            {/* Home page for logged-in users (charts) */}
            <Route path="/home" element={<Dashboard />} />{" "}
            {/* Charts are on /home */}
            <Route path="/exercises" element={<ExerciseSelection />} />
            <Route path="/workout/:id" element={<WorkoutPage />} />
            <Route path="/profile" element={<ProfilePage />} />{" "}
            {/* NEW: Profile Page Route */}
            {/* Default route for authenticated users, redirect to /home or /exercises */}
            <Route path="*" element={<Dashboard />} />{" "}
            {/* If they land on any undefined path, redirect to Dashboard/Home */}
          </Route>
        </Routes>
      </div>
    </>
  );
};

export default App;
