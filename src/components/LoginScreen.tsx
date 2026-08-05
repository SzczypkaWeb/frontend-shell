import { useState, type FormEvent } from 'react';
import { Button, Input } from '@szczypkaweb/shared-ui';
import { useAuthStore } from '../store/authStore';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return errors;
}

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validate(email, password);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      // authStore now holds the logged-in user; send the user back to the shell's home page.
      window.location.assign('/');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Login failed.');
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: '320px', margin: '3rem auto' }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
          autoComplete="current-password"
        />
        {formError ? (
          <p role="alert" style={{ color: '#b91c1c' }}>
            {formError}
          </p>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          Log in
        </Button>
      </form>
    </div>
  );
}
