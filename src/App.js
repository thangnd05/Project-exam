import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import DefaultLayout from "./Layout/DefaultLayout";
import routes from "./routes";
// import ProtectedRoute from "./routes/ProtectedRoute";
import "bootstrap/dist/css/bootstrap.min.css";
import { UserProvider } from "~/context/AuthContext";
import ScrollHandler from "./Layout/ScrollToTopOnRouteChange";
function App() {
  return (
    <UserProvider>
      <Router>
        <ScrollHandler />
        <div className="App">
          <Routes>
            {/* Public Routes */}
            {routes.publicRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`public-${index}`}
                  path={route.path}
                  element={
                    <Layout noContainer={route.noContainer || false}>
                      <Page />
                    </Layout>
                  }
                />
              );
            })}

            {/* Private Routes */}
            {/* {routes.privateRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute requiredRole={route.requiredRole}>
                      <Layout noContainer={route.noContainer || false}>
                        <Page />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              );
            })} */}
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;