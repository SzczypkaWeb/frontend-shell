import { useUsers } from './hooks/useUsers';
import { useUIStore } from './store/uiStore';

export default function App() {
  const { data, isLoading, error } = useUsers();
  const {
    theme,

    toggleTheme,
  } = useUIStore();

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
    </div>
  );
}
