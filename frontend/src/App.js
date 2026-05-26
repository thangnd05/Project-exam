import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import DefaultLayout from './layout/DefaultLayout';
import { publicRoutes, privateRoutes, adminRoutes } from './routes';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './admin/layouts/AdminLayout';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from '~/context/AuthContext';
import ScrollHandler from './layout/ScrollToTopOnRouteChange';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollProgressBar from '~/components/common/ScrollProgressBar';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollHandler />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          limit={3}
          style={{ zIndex: 99999 }}
        />
        <div className="App">
          <ScrollProgressBar />
          <Routes>
            {/* Public Routes */}
            {publicRoutes.map((route, index) => {
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

            {/*  Admin Routes */}
            {adminRoutes.map((route, index) => {
              const Page = route.component;
              return (
                <Route
                  key={`admin-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute requiredRoleName="ADMIN">
                      <AdminLayout>
                        <Page />
                      </AdminLayout>
                    </ProtectedRoute>
                  }
                />
              );
            })}

            {/*  Private Routes */}
            {privateRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute allowGuest={route.allowGuest || false}>
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
