import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import LandingPage from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ForgotPasswordForm } from './components/ForgotPasswordForm';
import { ResetPasswordForm } from './components/ResetPasswordForm';
import { AnimatedForm } from './components/AnimatedForm';

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
          '*': {
            boxSizing: 'border-box',
          },
          'html, body': {
            margin: 0,
            padding: 0,
            backgroundColor: '#F5F3FF',
            overflowX: 'hidden',
          },
          '#root': {
            minHeight: '100vh',
            backgroundColor: '#F5F3FF',
          },
        }}
      />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPages />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;