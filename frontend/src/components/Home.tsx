import React from "react";

const Home: React.FC = () => {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <div className="container mt-5">
      <div className="p-5 mb-4 bg-light rounded-3">
        <div className="container-fluid py-5">
          <h1 className="display-5 fw-bold">
            {isAuthenticated
              ? "Welcome back to Fitness Tracker AI!"
              : "Welcome to Fitness Tracker AI!"}
          </h1>
          <p className="col-md-8 fs-4">
            {isAuthenticated
              ? "Ready to start a new workout?"
              : "Get started by registering or logging in."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
