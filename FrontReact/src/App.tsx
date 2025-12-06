import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import LandingPage from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { UserProfile } from './components/UserProfile';
import { DashboardPage } from './pages/DashboardPage';

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
        </Routes>
      </Router>
    </>
  );
}

export default App;
