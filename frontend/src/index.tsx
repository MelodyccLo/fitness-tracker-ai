import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from 'react';
import ReactDOM from "react-dom/client";
import "./index.css"; // Or whatever your CSS file is named
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom"; // Import Router here

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <Router>
      {" "}
      {/* Wrap App with Router here */}
      <App />
    </Router>
  </React.StrictMode>
);
