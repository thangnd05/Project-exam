import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DefaultLayout from './Layout/DefaultLayout';
import routes from './routes';
import ProtectedRoute from './routes/ProtectedRoute'; // ✅ Import ProtectedRoute
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from '~/context/AuthContext';
import ScrollHandler from './Layout/ScrollToTopOnRouteChange';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollHandler />
        <ToastContainer position="top-right" autoClose={3000} />
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

            {/* ✅ Private Routes (Bỏ comment và sử dụng ProtectedRoute) */}
            {routes.privateRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute>
                      <Layout noContainer={route.noContainer || false}>
                        <Page />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              );
            })}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
