import { useAppVersion } from '../hooks/useAppVersion';

export function AppVersionDisplay() {
  const { data: version } = useAppVersion();

  if (!version) {
    return null;
  }

  return (
    <span
      style={{
        fontSize: '0.75rem',
        color: 'rgba(0, 0, 0, 0.4)',
        display: 'block',
        textAlign: 'center',
        marginTop: '1rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      title={`App version: ${version}`}
    >
      v{version}
    </span>
  );
}
