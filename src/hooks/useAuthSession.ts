import { t } from '../language';
import { FormEvent, useEffect, useState } from 'react';
import { clearStoredToken, getStoredToken, login, logout, me, register, setStoredToken } from '../auth';
import type { User } from '../types';
import type { AuthMode, LoginForm, RegisterForm } from '../ui-types';

type UseAuthSessionOptions = {
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

const initialLoginForm: LoginForm = {
  email: '',
  password: '',
};

const initialRegisterForm: RegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

export function useAuthSession({ setError, setSuccess }: UseAuthSessionOptions) {
  const [mode, setMode] = useState<AuthMode>(() => new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login');
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [loginForm, setLoginForm] = useState<LoginForm>(initialLoginForm);
  const [registerForm, setRegisterForm] = useState<RegisterForm>(initialRegisterForm);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!token) {
        if (!active) {
          return;
        }

        setUser(null);
        setLoadingSession(false);
        return;
      }

      try {
        const response = await me(token);
        if (!active) {
          return;
        }

        setUser(response.user);
        setError(null);
      } catch {
        if (!active) {
          return;
        }

        clearStoredToken();
        setToken(null);
        setUser(null);
        setError(t("Sessao expirada. Faz login novamente.", "Your session expired. Sign in again."));
      } finally {
        if (active) {
          setLoadingSession(false);
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, [token, setError]);

  async function handleLoginSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await login({
        email: loginForm.email.trim(),
        password: loginForm.password,
      });

      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setSuccess(t("Sessao iniciada com sucesso.", "Signed in."));
      setLoginForm(initialLoginForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao iniciar sessao.", "Could not sign in."));
    } finally {
      setSubmitting(false);
      setLoadingSession(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await register({
        first_name: registerForm.firstName.trim(),
        last_name: registerForm.lastName.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
        password_confirmation: registerForm.passwordConfirmation,
      });

      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
      setSuccess(t("Conta criada e sessao iniciada.", "Your account is ready. You are signed in."));
      setRegisterForm(initialRegisterForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao criar conta.", "Could not create the account."));
    } finally {
      setSubmitting(false);
      setLoadingSession(false);
    }
  }

  async function handleLogout() {
    if (!token) {
      return;
    }

    try {
      await logout(token);
    } catch {
      // Session token can already be expired.
    }

    clearStoredToken();
    setToken(null);
    setUser(null);
    setSuccess(t("Sessao terminada.", "Signed out."));
    setError(null);
  }

  return {
    mode,
    setMode,
    token,
    setToken,
    user,
    setUser,
    loadingSession,
    submitting,
    loginForm,
    setLoginForm,
    registerForm,
    setRegisterForm,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleLogout,
  };
}
