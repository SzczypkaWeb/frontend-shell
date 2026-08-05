import { useEffect } from 'react';
import App from './App';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { useAuthStore } from './store/authStore';

// Top-level layout: always renders the Navbar, then either the Login screen
// or the shell's home content depending on the current path. There's no
// router in this app yet, so routing is intentionally minimal - see
// webpack.config.ts's devServer.historyApiFallback for why a direct request
// to /login still resolves to this same bundle.
export function AppShell() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  // Restore session state (if any) once, on app mount, per the authStore spec.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isLoginPage = window.location.pathname === '/login';

  return (
    <>
      <Navbar />
      {isLoginPage ? <LoginScreen /> : <App />}
    </>
  );
}
