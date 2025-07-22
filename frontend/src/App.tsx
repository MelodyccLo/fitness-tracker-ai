import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ExerciseSelection from './pages/ExerciseSelection';
import Dashboard from "./components/Dashboard";
import PrivateRoute from "./components/PrivateRoute";

const App: React.FC = () => {
  const navigate = useNavigate(); // Hook for programmatic navigation

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove JWT from local storage
    alert("You have been logged out.");
    navigate("/login"); // Redirect to login page
  };

  return (
    <>
      <nav
        style={{
          padding: "1rem",
          backgroundColor: "#333",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to="/"
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "white",
            textDecoration: "none",
          }}
        >
          Fitness Tracker AI
        </Link>
        <div>
          <Link
            to="/login"
            style={{
              marginRight: "1rem",
              color: "white",
              textDecoration: "none",
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={{
              marginRight: "1rem",
              color: "white",
              textDecoration: "none",
            }}
          >
            Register
          </Link>
          {/* Add this link to ExerciseSelection */}
          <Link
            to="/exercises"
            style={{
              marginRight: "1rem",
              color: "white",
              textDecoration: "none",
            }}
          >
            Exercises
          </Link>
          {localStorage.getItem("token") && (
            <button
              onClick={handleLogout}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* Add this route for ExerciseSelection */}
        <Route
          path="/exercises"
          element={
            <PrivateRoute>
              <ExerciseSelection />
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
        {/* You will also need a route for a specific exercise workout page, e.g., /exercise/:id */}
        {/* <Route path="/exercise/:id" element={<PrivateRoute><WorkoutPage /></PrivateRoute>} /> */}
      </Routes>
    </>
  );
};

export default App;