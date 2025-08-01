import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { isAuthenticated } from "../utils/authUtils"; // Assuming this utility exists

const PrivateRoute: React.FC = () => {
  const auth = isAuthenticated();
  return auth ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
