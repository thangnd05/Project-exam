import ReactDOM from "react-dom/client";
import App from "./App";
import GlobalStyles from "~/shared/styles/GlobalStyles/GlobalStyles";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <GlobalStyles>
    <App />
  </GlobalStyles>
);