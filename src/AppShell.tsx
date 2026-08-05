import { useEffect } from 'react';
import App from './App';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { useAuthStore } from './store/authStore';

// Top-level layout: always renders the Navbar, then decides between a
// loading state, the Login screen, or the shell's home content based on
// *real* auth state (authStore), not the URL - App (and everything it
// mounts, e.g. useUsers() -> GET /users) must never render before the
// initial checkAuth() call has confirmed the user is logged in. There's no
// router in this app yet, so routing is intentionally minimal beyond that -
// see webpack.config.ts's devServer.historyApiFallback for why a direct
// request to /login still resolves to this same bundle.
export function AppShell() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const user = useAuthStore((state) => state.user);
  const isAuthChecked = useAuthStore((state) => state.isAuthChecked);
  const isAuthenticated = user !== null;

  // Restore session state (if any) once, on app mount, per the authStore spec.
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isLoginPage = window.location.pathname === '/login';

  // An already-authenticated user hitting /login has nothing to do there -
  // send them home instead of showing the login form again.
  useEffect(() => {
    if (isAuthChecked && isAuthenticated && isLoginPage) {
      window.location.assign('/');
    }
  }, [isAuthChecked, isAuthenticated, isLoginPage]);

  function renderContent() {
    if (!isAuthChecked) {
      // Still waiting on the initial checkAuth() call - render neither
      // LoginScreen nor App so no protected data is requested yet.
      return <p>Loading…</p>;
    }
    if (!isAuthenticated) {
      // Confirmed logged out: always show LoginScreen, regardless of path,
      // so App/useUsers never mounts for a logged-out user.
      return <LoginScreen />;
    }
    return <App />;
  }

  return (
    <>
      <Navbar />
      {renderContent()}
    </>
  );
}
