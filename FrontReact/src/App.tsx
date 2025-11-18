import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import LandingPage from './components/LandingPage';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { AnimatedForm } from './components/AnimatedForm';

function AuthPages() {
  const [isSignIn, setIsSignIn] = React.useState(true);

  return (
    <AnimatedForm key={isSignIn ? 'signin' : 'signup'}>
      {isSignIn ? (
        <SignIn onToggleMode={() => setIsSignIn(false)} />
      ) : (
        <SignUp onToggleMode={() => setIsSignIn(true)} />
      )}
    </AnimatedForm>
  );
}

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