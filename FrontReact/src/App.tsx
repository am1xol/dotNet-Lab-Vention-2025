import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Typography, Button, AppBar, Toolbar } from '@mui/material';
import { useAuthStore } from './store/auth-store';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { AnimatedForm } from './components/AnimatedForm';

function Home() {
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom>
        Welcome to Subscription Manager
      </Typography>
      {isAuthenticated ? (
        <div>
          <Typography variant="h5">Hello, {user?.email}!</Typography>
          <Button variant="outlined" onClick={logout} sx={{ mt: 2 }}>
            Logout
          </Button>
        </div>
      ) : (
        <Typography>Please sign in or register.</Typography>
      )}
    </Container>
  );
}

function AuthPages() {
  const [isSignIn, setIsSignIn] = useState(true);

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
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Subscription Manager
          </Typography>
        </Toolbar>
      </AppBar>

      <Routes>
        <Route path="/" element={isAuthenticated ? <Home /> : <AuthPages />} />
      </Routes>
    </Router>
  );
}

export default App;
