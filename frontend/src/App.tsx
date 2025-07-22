import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ExerciseSelection from "./components/ExerciseSelection";
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";
import WorkoutPage from "./components/WorkoutPage";
import Navbar from "./components/layout/Navbar";

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/exercises"
          element={
            <PrivateRoute>
              <ExerciseSelection />
            </PrivateRoute>
          }
        />
        <Route
          path="/exercise/:id"
          element={
            <PrivateRoute>
              <WorkoutPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
