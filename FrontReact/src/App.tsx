import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import LandingPage from './pages/LandingPage';
import { SignIn } from './components/auth/SignIn';
import { SignUp } from './components/auth/SignUp';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { UserProfile } from './components/profile/UserProfile';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { CategorySubscriptionsPage } from './pages/CategorySubscriptionsPage';
import UserChatWidget from './components/shared/UserChatWidget';
import { useAuthStore } from './store/auth-store';

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
      <UserChatWidget />
      <GlobalStyles
        styles={{
          'html, body': {
            overflowX: 'hidden',
          },
        }}
      />
      <Router>
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
        </Routes>
      </Router>
    </>
  );
}

export default App;
