import { useUsers } from "./hooks/useUsers"

export default function App() {
  const {data, isLoading, error} = useUsers();

  if(isLoading) return <p>Ładowanie...</p>
  if(error) return <p>Błąd: {(error as Error).message}</p>
  return (
    <div>
      <h1>shell działa</h1>;
    <ul>{data?.map((u) => <li key={u.id}>{u.email}</li>)}</ul>
    </div>
  )
}