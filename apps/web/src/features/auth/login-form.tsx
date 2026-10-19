"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useGetSessionQuery, useLoginMutation } from "@/store/api";
import { useLocale } from "@/i18n/locale-provider";
import { usePageMetadata } from "@/i18n/page-metadata";

export function LoginForm() {
  usePageMetadata("login");
  const { t } = useLocale();
  const { data } = useGetSessionQuery();
  const [login, { isLoading, error }] = useLoginMutation();
  const [invalid, setInvalid] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const status = error && "status" in error ? error.status : undefined;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    if (!username.trim() || !password) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    // RTK Query exposes request failures through the error value below.
    await login({ username: username.trim(), password });
    setPassword("");
  }
  return (
    <section className="inventory-page auth-page" aria-labelledby="login-title">
      <h1 id="login-title" className="inventory-page__title">
        {t("login")}
      </h1>
      {data?.user ? (
        <div role="status">
          <p>{t("signedInAs", { username: data.user.username })}</p>
          <Link href="/orders" className="auth-button auth-button--primary btn">
            {t("backToOrders")}
          </Link>
        </div>
      ) : (
        <>
          <p>{t("loginDescription")}</p>
          <form
            className="auth-form"
            onSubmit={submit}
            noValidate
            aria-busy={isLoading}
          >
            <fieldset disabled={isLoading}>
              <legend className="visually-hidden">{t("login")}</legend>
              <label className="form-label" htmlFor="login-username">
                {t("username")}
              </label>
              <input
                className="form-control mb-3"
                id="login-username"
                name="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                maxLength={100}
                required
              />
              <label className="form-label" htmlFor="login-password">
                {t("password")}
              </label>
              <input
                className="form-control mb-3"
                id="login-password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
              />
              {invalid && <p role="alert">{t("loginRequired")}</p>}
              {error && (
                <p role="alert">
                  {status === 401
                    ? t("invalidCredentials")
                    : t("loginError")}
                </p>
              )}
              <button
                className="auth-button auth-button--primary btn"
                type="submit"
              >
                {isLoading ? t("loggingIn") : t("login")}
              </button>
            </fieldset>
          </form>
        </>
      )}
    </section>
  );
}
