import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import { lazy, Suspense } from 'react';
import { useAuthStore } from './store/auth-store';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.default })));
const SignIn = lazy(() => import('./components/auth/SignIn').then(m => ({ default: m.SignIn })));
const SignUp = lazy(() => import('./components/auth/SignUp').then(m => ({ default: m.SignUp })));
const ForgotPasswordForm = lazy(() => import('./components/auth/ForgotPasswordForm').then(m => ({ default: m.ForgotPasswordForm })));
const ResetPasswordForm = lazy(() => import('./components/auth/ResetPasswordForm').then(m => ({ default: m.ResetPasswordForm })));
const UserProfile = lazy(() => import('./components/profile/UserProfile').then(m => ({ default: m.UserProfile })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const CategorySubscriptionsPage = lazy(() => import('./pages/CategorySubscriptionsPage').then(m => ({ default: m.CategorySubscriptionsPage })));
const ArticlesFaqPage = lazy(() => import('./pages/ArticlesFaqPage').then(m => ({ default: m.default })));
const UserChatWidget = lazy(() => import('./components/shared/UserChatWidget').then(m => ({ default: m.default })));
const FaqFabWidget = lazy(() => import('./components/shared/FaqFabWidget').then(m => ({ default: m.default })));

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE7F6 50%, #E8EAF6 100%)'
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: '3px solid #B39DDB',
      borderTop: '3px solid #7E57C2',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/signin" replace />;
  }
  
  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <>
      <GlobalStyles
        styles={{
          'html, body': {
            overflowX: 'hidden',
          },
        }}
      />
      <Router>
        <Suspense fallback={<PageLoader />}>
          <UserChatWidget />
          <FaqFabWidget />
          <Routes>
            <Route path="/" element={<LandingPage />} />

          <Route
            path="/auth"
            element={<Navigate to="/auth/signin" replace />}
          />

          <Route path="/auth/signin" element={<SignIn />} />
          <Route path="/auth/signup" element={<SignUp />} />
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordForm />}
          />
          <Route path="/auth/reset-password" element={<ResetPasswordForm />} />

          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />

          <Route
            path="/category/:category"
            element={<CategorySubscriptionsPage />}
          />

          <Route
            path="/articles-faq"
            element={<ArticlesFaqPage />}
          />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}

export default App;
