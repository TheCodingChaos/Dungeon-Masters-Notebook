import React from "react";
import "./App.css";
import { BrowserRouter as Router } from "react-router-dom";
import NavBar from "./components/NavBar";
import AppRoutes from "./routes/routes";

function App() {
  return (
    <Router>
      <NavBar />
      <AppRoutes />
    </Router>
  );
}

export default App;
