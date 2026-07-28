import { useUsers } from './hooks/useUsers';
import { useUIStore } from './store/uiStore';
import { AppVersionDisplay } from './components/AppVersionDisplay';
import { RemoteWidget } from './components/RemoteWidget';

export default function App() {
  const { data, isLoading, error } = useUsers();
  const { theme, toggleTheme } = useUIStore();

  if (isLoading) return <p>Ładowanie...</p>;
  if (error) return <p>Błąd: {(error as Error).message}</p>;
  return (
    <div>
      <h1>shell działa</h1>
      <button onClick={() => toggleTheme()}>{theme}</button>
      <ul>
        {data?.map((u) => (
          <li key={u.id}>{u.email}</li>
        ))}
      </ul>
      <section style={{ marginTop: '2rem' }}>
        <h2>Zdalny widget (react-app)</h2>
        <RemoteWidget />
      </section>
      <footer style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '2rem' }}>
        <AppVersionDisplay />
      </footer>
    </div>
  );
}
