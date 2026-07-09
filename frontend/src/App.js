import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '~/shared/config/queryClient';
import DefaultLayout from './layout/DefaultLayout';
import { publicRoutes, privateRoutes, adminRoutes } from './routes';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminLayout from './admin/layouts/AdminLayout';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from '~/shared/context/AuthContext';
import { StreakProvider } from '~/shared/context/StreakContext';
import { CoinProvider } from '~/shared/context/CoinContext';
import { CosmeticProvider } from '~/shared/context/CosmeticContext';
import StreakCelebration from '~/components/streak/StreakCelebration';
import ScrollHandler from './layout/ScrollToTopOnRouteChange';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScrollProgressBar from '~/shared/ui/ScrollProgressBar';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <StreakProvider>
      <CoinProvider>
      <CosmeticProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
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
          <StreakCelebration />
          <Routes>

            {publicRoutes.map((route, index) => {
              const Page = route.component;
              if (route.noLayout) {
                return (
                  <Route
                    key={`public-${index}`}
                    path={route.path}
                    element={<Page />}
                  />
                );
              }
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`public-${index}`}
                  path={route.path}
                  element={
                    <Layout
                      noContainer={route.noContainer || false}
                      hideFooter={route.hideFooter || false}
                      hideScrollToTop={route.hideScrollToTop || false}
                    >
                      <Page />
                    </Layout>
                  }
                />
              );
            })}

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

            {privateRoutes.map((route, index) => {
              const Page = route.component;
              const Layout = DefaultLayout;
              return (
                <Route
                  key={`private-${index}`}
                  path={route.path}
                  element={
                    <ProtectedRoute allowGuest={route.allowGuest || false}>
                      <Layout
                        noContainer={route.noContainer || false}
                        hideFooter={route.hideFooter || false}
                        hideScrollToTop={route.hideScrollToTop || false}
                      >
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
      </CosmeticProvider>
      </CoinProvider>
      </StreakProvider>
    </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
