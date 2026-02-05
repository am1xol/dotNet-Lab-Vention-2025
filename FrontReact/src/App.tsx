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
import { CategorySubscriptionsPage } from './pages/CategorySubscriptionsPage';

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
            path="/category/:category"
            element={<CategorySubscriptionsPage />}
          />
        </Routes>
      </Router>
    </>
  );
}

export default App;
