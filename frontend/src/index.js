// src/index.js (hoặc src/main.jsx)
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import GlobalStyles from "./components/GlobalStyles/GlobalStyles";
import axios from "axios";

// ⚙️ Config axios global
const apiBaseUrl = (process.env.REACT_APP_API_BASE_URL || "").trim().replace(/\/$/, "");
axios.defaults.baseURL = apiBaseUrl;
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GlobalStyles>
    <App />
  </GlobalStyles>
);
