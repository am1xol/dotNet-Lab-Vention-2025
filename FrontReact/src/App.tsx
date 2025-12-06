import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import LandingPage from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { AnimatedForm } from './components/AnimatedForm';
import { UserProfile } from './components/UserProfile';
import { DashboardPage } from './pages/DashboardPage';

type AuthPage = 'signin' | 'signup' | 'forgot-password' | 'reset-password';

const AuthPages: React.FC = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<AuthPage>('signin');
  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const form = searchParams.get('form');

    if (form === 'signup') {
      setCurrentPage('signup');
    } else if (form === 'signin') {
      setCurrentPage('signin');
    }
  }, [location]);

  const handleShowForgotPassword = () => setCurrentPage('forgot-password');
  const handleShowResetForm = (email: string) => {
    setResetEmail(email);
    setCurrentPage('reset-password');
  };
  const handleBackToSignIn = () => setCurrentPage('signin');

  return (
    <AnimatedForm key={currentPage}>
      {currentPage === 'signin' && (
        <SignIn
          onToggleMode={() => setCurrentPage('signup')}
          onShowForgotPassword={handleShowForgotPassword}
        />
      )}
      {currentPage === 'signup' && (
        <SignUp onToggleMode={() => setCurrentPage('signin')} />
      )}
      {currentPage === 'forgot-password' && (
        <ForgotPasswordForm
          onBackToSignIn={handleBackToSignIn}
          onShowResetForm={handleShowResetForm}
        />
      )}
      {currentPage === 'reset-password' && (
        <ResetPasswordForm
          email={resetEmail}
          onBackToSignIn={handleBackToSignIn}
          onBackToForgotPassword={() => setCurrentPage('forgot-password')}
        />
      )}
    </AnimatedForm>
  );
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
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPages />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
