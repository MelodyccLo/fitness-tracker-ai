// frontend/src/components/layout/Navbar.tsx

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from '../../utils/authUtils'; // Import isAuthenticated utility

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const isUserAuthenticated = isAuthenticated();

  const handleLogout = () => {
    localStorage.removeItem("token"); // Clear token
    alert("You have been logged out.");
    navigate("/login"); // Redirect to login
  };

  return (
    <nav className="navbar navbar-expand-lg app-navbar"> {/* Use custom class for theming */}
      <div className="container-fluid">
        {/* App title/icon now links to /home for logged-in users */}
        <Link className="navbar-brand" to={isUserAuthenticated ? "/home" : "/"}>
          Fitness Tracker AI
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <div className="navbar-nav ms-auto">
            {!isUserAuthenticated ? (
              <>
                <Link className="nav-link" to="/login">
                  Login
                </Link>
                <Link className="nav-link" to="/register">
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/exercises">
                  Exercises
                </Link>
                <Link className="nav-link" to="/profile"> {/* NEW: Link to /profile */}
                  My Profile
                </Link>
                <button
                  className="btn btn-link nav-link custom-logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;