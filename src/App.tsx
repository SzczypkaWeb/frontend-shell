import { useUsers } from './hooks/useUsers';
import { useUIStore } from './store/uiStore';
import { AppVersionDisplay } from './components/AppVersionDisplay';

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
      <footer style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem', marginTop: '2rem' }}>
        <AppVersionDisplay />
      </footer>
    </div>
  );
}
