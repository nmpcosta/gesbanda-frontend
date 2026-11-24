import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type { AuthMode, LoginForm, RegisterForm } from '../../ui-types';

type AuthFormsProps = {
  mode: AuthMode;
  submitting: boolean;
  loginForm: LoginForm;
  registerForm: RegisterForm;
  setMode: (mode: AuthMode) => void;
  setLoginForm: (updater: (previous: LoginForm) => LoginForm) => void;
  setRegisterForm: (updater: (previous: RegisterForm) => RegisterForm) => void;
  onLoginSubmit: (event: FormEvent) => void;
  onRegisterSubmit: (event: FormEvent) => void;
};

export function AuthForms({
  mode,
  submitting,
  loginForm,
  registerForm,
  setMode,
  setLoginForm,
  setRegisterForm,
  onLoginSubmit,
  onRegisterSubmit,
}: AuthFormsProps) {
  return (
    <section className="auth-shell">
      <div className="mode-switch">
        <button
          type="button"
          className={mode === 'login' ? 'active' : ''}
          onClick={() => setMode('login')}
        >
          {t("Entrar", "Sign in")}
        </button>
        <button
          type="button"
          className={mode === 'register' ? 'active' : ''}
          onClick={() => setMode('register')}
        >
          {t("Criar conta", "Create account")}
        </button>
      </div>

      {mode === 'login' ? (
        <form className="form" onSubmit={onLoginSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={loginForm.email}
              onChange={(event) =>
                setLoginForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? t("A entrar...", "Signing in…") : t("Entrar", "Sign in")}
          </button>
        </form>
      ) : (
        <form className="form" onSubmit={onRegisterSubmit}>
          <label>
            {t("Nome", "Name")}
            <input
              type="text"
              required
              value={registerForm.firstName}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  firstName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            {t("Apelido", "Last name")}
            <input
              type="text"
              required
              value={registerForm.lastName}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  lastName: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Email
            <input
              type="email"
              required
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  email: event.target.value,
                }))
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              minLength={8}
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  password: event.target.value,
                }))
              }
            />
          </label>

          <label>
            {t("Confirmar password", "Confirm password")}
            <input
              type="password"
              required
              minLength={8}
              value={registerForm.passwordConfirmation}
              onChange={(event) =>
                setRegisterForm((previous) => ({
                  ...previous,
                  passwordConfirmation: event.target.value,
                }))
              }
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? t("A criar conta...", "Creating account…") : t("Criar conta", "Create account")}
          </button>
        </form>
      )}
    </section>
  );
}
