// src/index.js (hoặc src/main.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GlobalStyles from "./components/GlobalStyles/GlobalStyles";
import axios from "axios";

// ⚙️ Config axios global
axios.defaults.baseURL = "http://localhost:8080";
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GlobalStyles>
    <App />
  </GlobalStyles>
);
