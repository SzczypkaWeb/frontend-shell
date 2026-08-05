import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { TextField, PasswordField, FormError, Button } from '@szczypkaweb/shared-ui';
import { useAuthStore } from '../store/authStore';
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Login failed.';
}

export function LoginScreen() {
  const login = useAuthStore((state) => state.login);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginFormValues) => login(email, password),
    onSuccess: () => {
      // authStore now holds the logged-in user; send the user back to the shell's home page.
      window.location.assign('/');
    },
  });

  return (
    <div className="mx-auto mt-12 max-w-xs">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>
      <form
        onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
        noValidate
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <TextField
            id="email"
            type="email"
            autoComplete="username"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
            Password
          </label>
          <PasswordField
            id="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>
        <FormError
          message={loginMutation.isError ? getErrorMessage(loginMutation.error) : undefined}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={loginMutation.isPending}
          aria-busy={loginMutation.isPending || undefined}
        >
          Log in
        </Button>
      </form>
    </div>
  );
}
